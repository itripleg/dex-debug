// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.22;

import "./VettedToken.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title TokenFactory
 * @author Josh Bell
 * @notice This contract is UNLICENSED and proprietary.
 * @dev A factory for creating tokens that trade on a linear bonding curve.
 *
 * --- CORE TOKENOMIC CONCEPTS ---
 *
 * 1.  **Dual Supply System:** This factory utilizes a 'virtualSupply' for its pricing calculations, which is intentionally distinct from the token's actual 'totalSupply()'.
 * - **virtualSupply:** The supply figure used exclusively by the bonding curve to determine buy/sell prices. It ONLY decreases when tokens are sold back to the factory.
 * - **Token.totalSupply():** The true circulating supply of the token. It decreases on BOTH factory sales and self-burns.
 *
 * 2.  **Two Burn Mechanisms:**
 * - **Factory Sells (`factoryBurn`):** When a user sells tokens to the factory, the factory burns the tokens, `virtualSupply` decreases, and ETH collateral is returned to the user.
 * - **Self-Burns (`burn`):** When a user self-burns their tokens, the `totalSupply()` decreases, and a `burnManager` contract is notified.  This action DOES NOT affect the `virtualSupply` or the price on the bonding curve.
 *
 * 3.  **Passive Value Accrual:** Because self-burns reduce the `totalSupply()` without removing the underlying ETH collateral from the factory, the remaining tokens become backed by more ETH. This is a key feature, not a bug. Users who self-burn forfeit their claim to the collateral in exchange for the reward offered by the `burnManager` contract (e.g., the Ymir NFT).
 */

contract TokenFactory is Ownable, ReentrancyGuard {
    enum TokenState {
        NOT_CREATED,
        TRADING,
        GOAL_REACHED,
        HALTED,
        RESUMED
    }

    // =================================================================
    //                           Constants
    // =================================================================

    /// @dev The number of decimal places for the tokens (18).
    uint256 public immutable DECIMALS;
    /// @dev The absolute maximum supply a token can have.
    uint256 public immutable MAX_SUPPLY;
    /// @dev The initial amount of tokens minted to the creator when a token is created (20% of MAX_SUPPLY).
    uint256 public immutable INITIAL_MINT;
    /// @dev The starting price for the very first token sold on the bonding curve.
    uint256 public immutable INITIAL_PRICE;
    /// @dev The minimum ETH value required for a single purchase.
    uint256 public immutable MIN_PURCHASE;
    /// @dev The maximum ETH value allowed for a single purchase.
    uint256 public immutable MAX_PURCHASE;
    /// @dev The maximum percentage of the total supply a single wallet can hold.
    uint256 public immutable MAX_WALLET_PERCENTAGE;
    /// @dev A coefficient that determines the steepness (slope) of the bonding curve.
    uint256 public immutable PRICE_RATE;
    /// @dev The trading fee expressed in basis points (1/100th of 1%). 30 = 0.3%.
    uint256 public constant TRADING_FEE = 30;

    // =================================================================
    //                         State Variables
    // =================================================================

    /// @dev The default funding goal in ETH (wei) for newly created tokens.
    uint256 public defaultFundingGoal;
    /// @dev The address that receives all trading fees.
    address public feeRecipient;

    /// @dev An array of all token contract addresses created by this factory.
    address[] private allTokens;
    /// @dev Maps a token address to its current trading state.
    mapping(address => TokenState) public tokens;
    /// @dev Maps a token address to the total ETH collateral backing it.
    mapping(address => uint256) public collateral;
    /// @dev Maps a token address to the address of its original creator.
    mapping(address => address) public tokenCreators;
    /// @dev Maps a token address to the average price of the last transaction.
    mapping(address => uint256) public lastPrice;
    /// @dev Maps a token address to its specific funding goal.
    mapping(address => uint256) private fundingGoals;
    /// @dev Maps a token address to its current total supply, including the initial mint.
    mapping(address => uint256) public virtualSupply;

    // =================================================================
    //                              Events
    // =================================================================

    event TokenCreated(
        address indexed tokenAddress,
        string name,
        string symbol,
        string imageUrl,
        address creator,
        uint256 fundingGoal,
        address burnManager
    );
    event TokensPurchased(
        address indexed token,
        address indexed buyer,
        uint256 amount,
        uint256 price,
        uint256 fee
    );
    event TokensSold(
        address indexed token,
        address indexed seller,
        uint256 tokenAmount,
        uint256 ethAmount,
        uint256 fee
    );
    event TradingHalted(address indexed token, uint256 collateral);
    event TradingResumed(address indexed token);
    event FeeRecipientUpdated(
        address indexed oldRecipient,
        address indexed newRecipient
    );
    event DefaultFundingGoalUpdated(uint256 oldGoal, uint256 newGoal);
    event TokenFundingGoalUpdated(
        address indexed token,
        uint256 oldGoal,
        uint256 newGoal
    );
    event EmergencyWithdrawal(address indexed owner, uint256 amount);

    // =================================================================
    //                            Modifiers
    // =================================================================

    /**
     * @dev Ensures that the given address is a valid token created by this factory.
     */
    modifier validToken(address tokenAddress) {
        require(
            tokens[tokenAddress] != TokenState.NOT_CREATED,
            "Invalid token"
        );
        _;
    }

    // =================================================================
    //                           Constructor
    // =================================================================

    constructor(address initialOwner) Ownable(initialOwner) {
        require(initialOwner != address(0), "Can't be zero address");
        feeRecipient = initialOwner;
        DECIMALS = 10 ** 18;
        MAX_SUPPLY = (10 ** 9) * DECIMALS; // 1 Billion tokens
        INITIAL_MINT = (MAX_SUPPLY * 20) / 100; // 20%
        defaultFundingGoal = 25 ether;
        INITIAL_PRICE = 0.00001 ether;
        PRICE_RATE = 2000;
        MIN_PURCHASE = INITIAL_PRICE;
        MAX_PURCHASE = 50 ether;
        MAX_WALLET_PERCENTAGE = 5; // 5%
    }

    // =================================================================
    //                      Owner-Only Functions
    // =================================================================

    /**
     * @dev Updates the address that receives trading fees.
     * @param newRecipient The address of the new fee recipient.
     */
    function setFeeRecipient(address newRecipient) external onlyOwner {
        require(newRecipient != address(0), "Invalid address");
        address oldRecipient = feeRecipient;
        feeRecipient = newRecipient;
        emit FeeRecipientUpdated(oldRecipient, newRecipient);
    }

    /**
     * @dev Sets the default funding goal for all new tokens.
     * @param newGoal The new funding goal in wei.
     */
    function setDefaultFundingGoal(uint256 newGoal) external onlyOwner {
        require(newGoal > 0, "Invalid funding goal");
        uint256 oldGoal = defaultFundingGoal;
        defaultFundingGoal = newGoal;
        emit DefaultFundingGoalUpdated(oldGoal, newGoal);
    }

    /**
     * @dev Updates the funding goal for a specific, existing token.
     * @param tokenAddress The address of the token to update.
     * @param newGoal The new funding goal in wei.
     */
    function setTokenFundingGoal(
        address tokenAddress,
        uint256 newGoal
    ) external onlyOwner validToken(tokenAddress) {
        require(newGoal > 0, "Invalid funding goal");
        require(
            tokens[tokenAddress] == TokenState.TRADING ||
                tokens[tokenAddress] == TokenState.RESUMED,
            "Token not in valid state"
        );
        require(
            collateral[tokenAddress] < fundingGoals[tokenAddress],
            "Goal already reached"
        );
        uint256 oldGoal = fundingGoals[tokenAddress];
        fundingGoals[tokenAddress] = newGoal;
        emit TokenFundingGoalUpdated(tokenAddress, oldGoal, newGoal);
        if (collateral[tokenAddress] >= newGoal) {
            tokens[tokenAddress] = TokenState.GOAL_REACHED;
            emit TradingHalted(tokenAddress, newGoal);
        }
    }

    /**
     * @dev Allows the owner to withdraw the entire ETH balance of this contract.
     * @notice This is an emergency function and should be used with extreme caution.
     * **This includes the collateral ETH backing all existing tokens, which is essential
     * for users to sell their tokens back to the factory.**
     * **After this withdrawal, users will be unable to sell their tokens, effectively
     * breaking the core trading (selling) functionality of the application.**
     */
    function withdrawAll() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");
        (bool success, ) = payable(msg.sender).call{value: balance}("");
        require(success, "Withdrawal failed");
        emit EmergencyWithdrawal(msg.sender, balance);
    }

    // =================================================================
    //                    Price Calculation Logic
    // =================================================================

    /**
     * @dev Calculates the trading fee for a given ETH amount.
     * @param amount The ETH amount in wei.
     * @return The calculated fee in wei.
     */
    function calculateFee(uint256 amount) public pure returns (uint256) {
        return (amount * TRADING_FEE) / 10000;
    }

    /**
     * @dev Internal function to calculate the integral of the bonding curve with corrected scaling.
     * This is the core mathematical engine for pricing.
     * @param effectiveSupplyStart The starting supply point (current supply - initial mint).
     * @param effectiveSupplyEnd The ending supply point.
     * @return The cost in ETH (wei) for the change in supply.
     */
    function _calculatePrice(
        uint256 effectiveSupplyStart,
        uint256 effectiveSupplyEnd
    ) internal view returns (uint256) {
        uint256 supplyRange = MAX_SUPPLY - INITIAL_MINT;
        require(supplyRange > 0, "Supply range cannot be zero");

        uint256 tokenAmount;
        if (effectiveSupplyEnd > effectiveSupplyStart) {
            tokenAmount = effectiveSupplyEnd - effectiveSupplyStart;
        } else {
            tokenAmount = effectiveSupplyStart - effectiveSupplyEnd;
        }

        uint256 sumOfSupplies = effectiveSupplyEnd + effectiveSupplyStart;
        uint256 scaledSum = PRICE_RATE * sumOfSupplies;

        uint256 costNumerator = INITIAL_PRICE *
            tokenAmount *
            (2 * supplyRange + scaledSum);

        // Denominator must be scaled by DECIMALS to correct for INITIAL_PRICE being 'per token' while supplies are in 'base units'.
        uint256 costDenominator = 2 * supplyRange * DECIMALS;

        require(costDenominator > 0, "Denominator cannot be zero");
        return costNumerator / costDenominator;
    }

    /**
     * @dev Calculates the ETH cost to purchase a given amount of tokens.
     * @param tokenAddress The address of the token.
     * @param tokenAmount The amount of tokens to buy (in base units).
     * @return The cost in ETH (wei).
     */
    function calculateBuyPrice(
        address tokenAddress,
        uint256 tokenAmount
    ) public view returns (uint256) {
        uint256 effectiveSupplyStart = virtualSupply[tokenAddress] -
            INITIAL_MINT;
        uint256 effectiveSupplyEnd = effectiveSupplyStart + tokenAmount;
        return _calculatePrice(effectiveSupplyStart, effectiveSupplyEnd);
    }

    /**
     * @dev Calculates the ETH received for selling a given amount of tokens.
     * @param tokenAddress The address of the token.
     * @param tokenAmount The amount of tokens to sell (in base units).
     * @return The ETH value in wei.
     */
    function calculateSellPrice(
        address tokenAddress,
        uint256 tokenAmount
    ) public view returns (uint256) {
        uint256 effectiveSupplyStart = virtualSupply[tokenAddress] -
            INITIAL_MINT;
        require(
            effectiveSupplyStart >= tokenAmount,
            "Cannot sell more than effective supply"
        );
        uint256 effectiveSupplyEnd = effectiveSupplyStart - tokenAmount;
        return _calculatePrice(effectiveSupplyStart, effectiveSupplyEnd);
    }

    /**
     * @dev Internal function to find how many tokens can be bought for a given ETH amount.
     * Uses a binary search for efficiency.
     * @param tokenAddress The address of the token.
     * @param ethAmount The amount of ETH to spend (in wei).
     * @return The amount of tokens that can be purchased (in base units).
     */
    function calculateTokensForETH(
        address tokenAddress,
        uint256 ethAmount
    ) internal view returns (uint256) {
        uint256 low = 0;
        uint256 high = MAX_SUPPLY - virtualSupply[tokenAddress];

        // A fixed-iteration binary search is gas-predictable and robust.
        for (uint i = 0; i < 100; i++) {
            if (low >= high) break;
            uint256 mid = (low + high + 1) / 2;
            if (mid == 0) break;

            uint256 cost = calculateBuyPrice(tokenAddress, mid);

            if (cost <= ethAmount) {
                low = mid;
            } else {
                high = mid - 1;
            }
        }
        return low;
    }

    /**
     * @dev Public view function to get a quote for how many tokens a given ETH amount can buy.
     * @param tokenAddress The address of the token.
     * @param ethAmount The amount of ETH to spend (in wei).
     * @return The amount of tokens that can be purchased (in base units).
     */
    function calculateTokenAmount(
        address tokenAddress,
        uint256 ethAmount
    ) public view returns (uint256) {
        return calculateTokensForETH(tokenAddress, ethAmount);
    }

    // =================================================================
    //                    Core State-Changing Functions
    // =================================================================

    /**
     * @dev Creates a new token, registers it, and sets initial parameters.
     * @param name The name of the new token.
     * @param symbol The symbol of the new token.
     * @param imageUrl A URL pointing to the token's image.
     * @param burnManager An address with special burn privileges on the token contract.
     * @return The address of the newly created token contract.
     */
    function createToken(
        string calldata name,
        string calldata symbol,
        string calldata imageUrl,
        address burnManager
    ) external returns (address) {
        require(
            bytes(name).length > 0 && bytes(name).length <= 32,
            "Invalid name"
        );
        require(
            bytes(symbol).length > 0 && bytes(symbol).length <= 8,
            "Invalid symbol"
        );
        require(bytes(imageUrl).length > 0, "Invalid image URL");

        Token token = new Token(
            address(this),
            msg.sender,
            name,
            symbol,
            imageUrl,
            burnManager
        );
        address tokenAddress = address(token);

        tokens[tokenAddress] = TokenState.TRADING;
        allTokens.push(tokenAddress);
        tokenCreators[tokenAddress] = msg.sender;
        lastPrice[tokenAddress] = INITIAL_PRICE;
        fundingGoals[tokenAddress] = defaultFundingGoal;
        virtualSupply[tokenAddress] = INITIAL_MINT;

        emit TokenCreated(
            tokenAddress,
            name,
            symbol,
            imageUrl,
            msg.sender,
            defaultFundingGoal,
            burnManager
        );
        return tokenAddress;
    }

    /**
     * @dev Allows a user to purchase tokens by sending ETH.
     * @param tokenAddress The address of the token to buy.
     */
    function buy(
        address tokenAddress
    ) external payable nonReentrant validToken(tokenAddress) {
        require(
            tokens[tokenAddress] == TokenState.TRADING ||
                tokens[tokenAddress] == TokenState.RESUMED,
            "Not trading"
        );
        require(
            msg.value >= MIN_PURCHASE && msg.value <= MAX_PURCHASE,
            "Invalid amount"
        );

        uint256 fee = calculateFee(msg.value);
        uint256 purchaseAmount = msg.value - fee;

        uint256 tokensToMint = calculateTokenAmount(
            tokenAddress,
            purchaseAmount
        );
        require(tokensToMint > 0, "ETH amount too low to buy any tokens");

        Token token = Token(tokenAddress);
        require(
            virtualSupply[tokenAddress] + tokensToMint <= MAX_SUPPLY,
            "Max supply"
        );

        uint256 newBalance = token.balanceOf(msg.sender) + tokensToMint;
        require(
            newBalance <= (MAX_SUPPLY * MAX_WALLET_PERCENTAGE) / 100,
            "Exceeds max wallet"
        );

        (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        virtualSupply[tokenAddress] += tokensToMint;
        token.mint(msg.sender, tokensToMint);
        collateral[tokenAddress] += purchaseAmount;
        lastPrice[tokenAddress] = (purchaseAmount * DECIMALS) / tokensToMint; // Store average price of this trade

        emit TokensPurchased(
            tokenAddress,
            msg.sender,
            tokensToMint,
            msg.value,
            fee
        );

        if (collateral[tokenAddress] >= fundingGoals[tokenAddress]) {
            tokens[tokenAddress] = TokenState.GOAL_REACHED;
            emit TradingHalted(tokenAddress, fundingGoals[tokenAddress]);
        }
    }

    /**
     * @dev Allows a user to sell tokens back to the contract for ETH.
     * @param tokenAddress The address of the token to sell.
     * @param tokenAmount The amount of tokens to sell (in base units).
     */
    function sell(
        address tokenAddress,
        uint256 tokenAmount
    ) external nonReentrant validToken(tokenAddress) {
        require(
            tokens[tokenAddress] == TokenState.TRADING ||
                tokens[tokenAddress] == TokenState.RESUMED,
            "Not trading"
        );
        require(tokenAmount > 0, "Amount must be > 0");

        Token token = Token(tokenAddress);
        require(
            token.balanceOf(msg.sender) >= tokenAmount,
            "Insufficient balance"
        );

        // grossAmount is the total ETH value of the tokens before fees.
        uint256 grossAmount = calculateSellPrice(tokenAddress, tokenAmount);
        uint256 fee = calculateFee(grossAmount);
        uint256 netAmountToReceive = grossAmount - fee;

        // CORRECT: The collateral must be sufficient to cover the ENTIRE gross amount.
        require(
            collateral[tokenAddress] >= grossAmount,
            "Insufficient token collateral"
        );

        token.factoryBurn(msg.sender, tokenAmount);
        virtualSupply[tokenAddress] -= tokenAmount;

        // CORRECT: The collateral is reduced by the ENTIRE gross amount paid out.
        collateral[tokenAddress] -= grossAmount;

        lastPrice[tokenAddress] = (grossAmount * DECIMALS) / tokenAmount; // Store average price of this trade

        // Send fee to recipient
        (bool feeSuccess, ) = payable(feeRecipient).call{value: fee}("");
        require(feeSuccess, "Fee transfer failed");

        // Send net amount to seller
        (bool success, ) = payable(msg.sender).call{value: netAmountToReceive}(
            ""
        );
        require(success, "Transfer failed");

        emit TokensSold(
            tokenAddress,
            msg.sender,
            tokenAmount,
            grossAmount,
            fee
        );
    }

    /**
     * @dev Allows the token creator to resume trading after a funding goal has been reached.
     * @param tokenAddress The address of the token to resume.
     */
    function resumeTrading(address tokenAddress) external {
        require(msg.sender == tokenCreators[tokenAddress], "Not token creator");
        require(
            tokens[tokenAddress] == TokenState.GOAL_REACHED,
            "Not ready to resume"
        );
        tokens[tokenAddress] = TokenState.RESUMED;
        emit TradingResumed(tokenAddress);
    }

    // =================================================================
    //                       Public View Functions
    // =================================================================

    /**
     * @dev Retrieves the current state of a token.
     */
    function getTokenState(address token) external view returns (TokenState) {
        return tokens[token];
    }

    /**
     * @dev Retrieves the list of all tokens created by this factory.
     */
    function getAllTokens() external view returns (address[] memory) {
        return allTokens;
    }

    /**
     * @dev Retrieves the specific funding goal for a given token.
     */
    function getFundingGoal(address token) external view returns (uint256) {
        return fundingGoals[token];
    }
}
