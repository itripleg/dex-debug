#!/usr/bin/env python3
"""
Simple Game Bot for BigBrain Battle Arena
Listens for GameStarted events and responds with AI outcomes
Now pays rewards in AVAX instead of tokens
"""

import time
import random
import json
from datetime import datetime
from web3 import Web3
from eth_account import Account

class SimpleGameBot:
    """A simple AI opponent that responds to game challenges"""
    
    def __init__(self, rpc_url, private_key, game_contract_address):
        """Initialize the game bot"""
        self.w3 = Web3(Web3.HTTPProvider(rpc_url))
        self.account = Account.from_key(private_key)
        
        if not self.w3.is_connected():
            raise ConnectionError(f"Failed to connect to RPC: {rpc_url}")
        
        print(f"🤖 SimpleGameBot: Connected to blockchain")
        print(f"🤖 SimpleGameBot: Bot wallet: {self.account.address}")
        
        # Game contract setup
        self.game_contract_address = self.w3.to_checksum_address(game_contract_address)
        self.game_contract = self._setup_game_contract()
        
        # AI personality settings
        self.ai_name = "Neural Network Alpha"
        self.win_rates = {
            0: 0.4,  # QUICK_BATTLE - 40% AI win rate (60% player win rate)
            1: 0.5,  # ARENA_FIGHT - 50% AI win rate  
            2: 0.7,  # BOSS_BATTLE - 70% AI win rate (30% player win rate)
        }
        
        # Response messages
        self._setup_response_messages()
        
        print(f"🤖 SimpleGameBot: Game contract at {self.game_contract_address}")
        print(f"🤖 SimpleGameBot: AI personality: {self.ai_name}")
        
        # Check initial AVAX reward pool
        self._check_reward_pool()
    
    def _setup_game_contract(self):
        """Setup the game contract with minimal ABI"""
        # Updated ABI with AVAX reward functions
        game_abi = [
            {
                "inputs": [
                    {"name": "gameId", "type": "uint256"},
                    {"name": "outcome", "type": "uint8"},
                    {"name": "aiMessage", "type": "string"}
                ],
                "name": "completeGame",
                "outputs": [],
                "stateMutability": "nonpayable",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "getAvaxRewardPool",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "inputs": [],
                "name": "depositAvax",
                "outputs": [],
                "stateMutability": "payable",
                "type": "function"
            },
            {
                "inputs": [
                    {"name": "burnAmount", "type": "uint256"},
                    {"name": "gameType", "type": "uint8"},
                    {"name": "outcome", "type": "uint8"}
                ],
                "name": "calculatePotentialReward",
                "outputs": [{"name": "", "type": "uint256"}],
                "stateMutability": "view",
                "type": "function"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "gameId", "type": "uint256"},
                    {"indexed": True, "name": "player", "type": "address"},
                    {"indexed": True, "name": "token", "type": "address"},
                    {"indexed": False, "name": "burnedAmount", "type": "uint256"},
                    {"indexed": False, "name": "gameType", "type": "uint8"},
                    {"indexed": False, "name": "timestamp", "type": "uint256"}
                ],
                "name": "GameStarted",
                "type": "event"
            },
            {
                "anonymous": False,
                "inputs": [
                    {"indexed": True, "name": "gameId", "type": "uint256"},
                    {"indexed": True, "name": "player", "type": "address"},
                    {"indexed": False, "name": "outcome", "type": "uint8"},
                    {"indexed": False, "name": "rewardAmount", "type": "uint256"},
                    {"indexed": False, "name": "aiMessage", "type": "string"},
                    {"indexed": False, "name": "timestamp", "type": "uint256"}
                ],
                "name": "GameCompleted",
                "type": "event"
            }
        ]
        
        return self.w3.eth.contract(
            address=self.game_contract_address,
            abi=game_abi
        )
    
    def _check_reward_pool(self):
        """Check the current AVAX reward pool balance"""
        try:
            pool_balance = self.game_contract.functions.getAvaxRewardPool().call()
            pool_avax = self.w3.from_wei(pool_balance, 'ether')
            print(f"🤖 SimpleGameBot: 💰 AVAX reward pool: {pool_avax:.6f} AVAX")
            
            if pool_balance < self.w3.to_wei(0.01, 'ether'):  # Less than 0.01 AVAX
                print(f"🤖 SimpleGameBot: ⚠️ WARNING: Reward pool is low!")
                
        except Exception as e:
            print(f"🤖 SimpleGameBot: ⚠️ Could not check reward pool: {e}")
    
    def _setup_response_messages(self):
        """Setup AI response messages for different outcomes"""
        self.messages = {
            # Player Victory messages
            "player_victory": [
                "Impressive! Your strategic thinking outmaneuvered my algorithms.",
                "Well played, human. You've earned this AVAX victory through superior intellect.",
                "Your logic was flawless. I concede defeat and your AVAX reward.",
                "Remarkable! You found the optimal solution faster than my neural networks.",
                "Victory is yours! Your cognitive abilities exceeded my calculations.",
            ],
            
            # AI Victory messages  
            "ai_victory": [
                "My neural networks have prevailed. Here's a small AVAX consolation.",
                "The algorithm has spoken. Your strategy was predictable.",
                "Logic triumph! My calculations were three steps ahead.",
                "Processing complete. The machine learning model was superior.",
                "Your approach was insufficient. I had calculated this outcome.",
            ],
            
            # Draw messages
            "draw": [
                "A perfect stalemate! Our intellectual capacities are evenly matched.",
                "Fascinating... our cognitive abilities appear equivalent. Fair AVAX split.",
                "The battle ends in equilibrium. Neither mind could dominate.",
                "A logical draw. We both chose optimal strategies.",
                "The algorithms reach consensus: this is a tie with shared rewards.",
            ],
            
            # Epic Victory messages (rare)
            "epic_victory": [
                "UNPRECEDENTED! Your brilliance has shattered my confidence matrices! Epic AVAX reward!",
                "ERROR 404: Victory not found in my database. You've achieved the impossible!",
                "CRITICAL ALERT: Human intelligence exceeded all AI parameters! Maximum rewards!",
                "SYSTEM OVERLOAD: Your genius broke my predictive models! Double AVAX!",
                "ANOMALY DETECTED: You've transcended computational limits! Epic payout!",
            ]
        }
    
    def _determine_outcome(self, game_type, burned_amount):
        """Determine game outcome based on game type and some randomness"""
        ai_win_rate = self.win_rates.get(game_type, 0.5)
        
        # Add some randomness based on burn amount (higher stakes = slightly better player odds)
        burned_tokens = float(self.w3.from_wei(burned_amount, 'ether'))
        if burned_tokens > 10000:  # Large burn gives slight player advantage
            ai_win_rate *= 0.9
        elif burned_tokens > 50000:  # Very large burn gives more advantage
            ai_win_rate *= 0.8
        
        # Determine outcome
        rand = random.random()
        
        if rand < ai_win_rate:
            # AI Victory (most common AI win)
            return 1, "ai_victory"
        elif rand < ai_win_rate + 0.05:  # 5% chance for draw
            return 2, "draw"
        elif rand < ai_win_rate + 0.15:  # 10% chance for epic victory
            return 3, "epic_victory"
        else:
            # Player Victory
            return 0, "player_victory"
    
    def _get_ai_message(self, message_type, game_type, burned_amount, potential_reward):
        """Get appropriate AI message for the outcome"""
        base_messages = self.messages[message_type]
        message = random.choice(base_messages)
        
        # Add some context based on game type
        game_types = ["quick battle", "arena fight", "boss battle"]
        game_name = game_types[game_type] if game_type < len(game_types) else "battle"
        
        # Add BBT burn context for significant amounts
        burned_tokens = float(self.w3.from_wei(burned_amount, 'ether'))
        reward_avax = float(self.w3.from_wei(potential_reward, 'ether'))
        
        if burned_tokens > 20000:
            message += f" That was a substantial {burned_tokens:,.0f} BBT wager!"
        
        if potential_reward > 0:
            message += f" Reward: {reward_avax:.6f} AVAX."
        
        return message
    
    def _calculate_potential_reward(self, burned_amount, game_type, outcome):
        """Calculate the potential AVAX reward for this outcome"""
        try:
            potential_reward = self.game_contract.functions.calculatePotentialReward(
                burned_amount,
                game_type,
                outcome
            ).call()
            return potential_reward
        except Exception as e:
            print(f"🤖 SimpleGameBot: ⚠️ Could not calculate potential reward: {e}")
            return 0
    
    def complete_game(self, game_id, game_type, burned_amount):
        """Complete a game with AI response"""
        try:
            print(f"🤖 SimpleGameBot: Processing game #{game_id} (type: {game_type})")
            
            # Determine outcome
            outcome, message_type = self._determine_outcome(game_type, burned_amount)
            
            # Calculate potential AVAX reward
            potential_reward = self._calculate_potential_reward(burned_amount, game_type, outcome)
            
            # Generate AI message with reward info
            ai_message = self._get_ai_message(message_type, game_type, burned_amount, potential_reward)
            
            print(f"🤖 SimpleGameBot: 🎯 Chosen outcome: {outcome} ({message_type})")
            print(f"🤖 SimpleGameBot: 💰 AVAX reward: {self.w3.from_wei(potential_reward, 'ether'):.6f}")
            print(f"🤖 SimpleGameBot: 💬 AI message: \"{ai_message}\"")
            
            # Check if reward pool has enough AVAX before proceeding
            current_pool = self.game_contract.functions.getAvaxRewardPool().call()
            if current_pool < potential_reward:
                print(f"🤖 SimpleGameBot: ⚠️ WARNING: Insufficient AVAX pool!")
                print(f"🤖 SimpleGameBot: 💰 Pool: {self.w3.from_wei(current_pool, 'ether'):.6f} AVAX")
                print(f"🤖 SimpleGameBot: 💸 Need: {self.w3.from_wei(potential_reward, 'ether'):.6f} AVAX")
                
                # Could implement auto-funding here if desired
                # For now, just proceed and let the contract handle the error
            
            # First, try to estimate gas to catch issues early
            try:
                gas_estimate = self.game_contract.functions.completeGame(
                    game_id,
                    outcome,
                    ai_message
                ).estimate_gas({'from': self.account.address})
                print(f"🤖 SimpleGameBot: ⛽ Gas estimate: {gas_estimate}")
            except Exception as gas_error:
                print(f"🤖 SimpleGameBot: ❌ Gas estimation failed: {gas_error}")
                print(f"🤖 SimpleGameBot: 🔍 This suggests the transaction would fail")
                
                # Check specific error conditions
                if "Insufficient AVAX reward pool" in str(gas_error):
                    print(f"🤖 SimpleGameBot: 💰 Issue: Not enough AVAX in reward pool")
                
                return False
            
            # Build transaction with estimated gas + buffer
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            gas_price = self.w3.eth.gas_price
            
            print(f"🤖 SimpleGameBot: 📊 Transaction details:")
            print(f"🤖 SimpleGameBot:   - Nonce: {nonce}")
            print(f"🤖 SimpleGameBot:   - Gas: {gas_estimate + 50000}")
            print(f"🤖 SimpleGameBot:   - Gas Price: {gas_price}")
            
            txn = self.game_contract.functions.completeGame(
                game_id,
                outcome,
                ai_message
            ).build_transaction({
                'from': self.account.address,
                'gas': gas_estimate + 50000,  # Add buffer to estimate
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': 43113  # Avalanche Fuji testnet
            })
            
            # Sign and send
            signed_txn = self.account.sign_transaction(txn)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            print(f"🤖 SimpleGameBot: ⏳ Transaction sent: {self.w3.to_hex(tx_hash)}")
            print(f"🤖 SimpleGameBot: ⏳ Waiting for confirmation...")
            
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                outcomes = ["PLAYER_VICTORY", "AI_VICTORY", "DRAW", "EPIC_VICTORY"]
                outcome_name = outcomes[outcome] if outcome < len(outcomes) else "UNKNOWN"
                reward_avax = self.w3.from_wei(potential_reward, 'ether')
                
                print(f"🤖 SimpleGameBot: ✅ Game #{game_id} completed!")
                print(f"🤖 SimpleGameBot: 🎯 Outcome: {outcome_name}")
                print(f"🤖 SimpleGameBot: 💰 AVAX reward: {reward_avax:.6f}")
                print(f"🤖 SimpleGameBot: 💬 Message: \"{ai_message}\"")
                print(f"🤖 SimpleGameBot: 📋 TX: {self.w3.to_hex(tx_hash)}")
                print(f"🤖 SimpleGameBot: ⛽ Gas used: {receipt.gasUsed}")
                
                # Update reward pool info
                self._check_reward_pool()
                return True
            else:
                print(f"🤖 SimpleGameBot: ❌ Transaction failed for game #{game_id}")
                print(f"🤖 SimpleGameBot: 📋 Failed TX: {self.w3.to_hex(tx_hash)}")
                print(f"🤖 SimpleGameBot: ⛽ Gas used: {receipt.gasUsed}")
                return False
                
        except Exception as e:
            print(f"🤖 SimpleGameBot: ❌ Error completing game #{game_id}: {e}")
            print(f"🤖 SimpleGameBot: 🔍 Error type: {type(e).__name__}")
            
            # Print more detailed error info
            if hasattr(e, 'args') and e.args:
                print(f"🤖 SimpleGameBot: 🔍 Error args: {e.args}")
            
            return False
    
    def deposit_avax_to_pool(self, amount_avax):
        """Deposit AVAX to the reward pool"""
        try:
            amount_wei = self.w3.to_wei(amount_avax, 'ether')
            
            print(f"🤖 SimpleGameBot: 💰 Depositing {amount_avax} AVAX to reward pool...")
            
            # Check bot balance
            bot_balance = self.w3.eth.get_balance(self.account.address)
            if bot_balance < amount_wei:
                print(f"🤖 SimpleGameBot: ❌ Insufficient bot balance!")
                print(f"🤖 SimpleGameBot: 💰 Need: {amount_avax} AVAX")
                print(f"🤖 SimpleGameBot: 💰 Have: {self.w3.from_wei(bot_balance, 'ether'):.6f} AVAX")
                return False
            
            # Estimate gas
            gas_estimate = self.game_contract.functions.depositAvax().estimate_gas({
                'from': self.account.address,
                'value': amount_wei
            })
            
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(self.account.address)
            gas_price = self.w3.eth.gas_price
            
            txn = self.game_contract.functions.depositAvax().build_transaction({
                'from': self.account.address,
                'value': amount_wei,
                'gas': gas_estimate + 10000,
                'gasPrice': gas_price,
                'nonce': nonce,
                'chainId': 43113
            })
            
            # Sign and send
            signed_txn = self.account.sign_transaction(txn)
            tx_hash = self.w3.eth.send_raw_transaction(signed_txn.rawTransaction)
            
            print(f"🤖 SimpleGameBot: ⏳ Deposit transaction sent: {self.w3.to_hex(tx_hash)}")
            
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt.status == 1:
                print(f"🤖 SimpleGameBot: ✅ Successfully deposited {amount_avax} AVAX!")
                self._check_reward_pool()
                return True
            else:
                print(f"🤖 SimpleGameBot: ❌ Deposit failed")
                return False
                
        except Exception as e:
            print(f"🤖 SimpleGameBot: ❌ Error depositing AVAX: {e}")
            return False
    
    def listen_for_games(self, auto_fund_threshold=0.01):
        """Listen for GameStarted events and respond"""
        print(f"🤖 SimpleGameBot: 👂 Listening for new games...")
        print(f"🤖 SimpleGameBot: 🎯 Monitoring contract: {self.game_contract_address}")
        print(f"🤖 SimpleGameBot: 💰 Auto-fund threshold: {auto_fund_threshold} AVAX")
        
        # Get the latest block to start listening from
        latest_block = self.w3.eth.block_number
        print(f"🤖 SimpleGameBot: 📦 Starting from block: {latest_block}")
        
        processed_games = set()  # Track processed games to avoid duplicates
        
        while True:
            try:
                # Check reward pool periodically
                current_pool = self.game_contract.functions.getAvaxRewardPool().call()
                current_pool_avax = self.w3.from_wei(current_pool, 'ether')
                
                if current_pool_avax < auto_fund_threshold:
                    print(f"🤖 SimpleGameBot: 💰 Reward pool low ({current_pool_avax:.6f} AVAX)")
                    print(f"🤖 SimpleGameBot: 💰 Consider funding the pool with depositAvax()")
                
                # Get current block
                current_block = self.w3.eth.block_number
                
                # Check for new GameStarted events in the last few blocks
                from_block = max(latest_block, current_block - 10)  # Look back max 10 blocks
                
                # Use a more reliable method to get events
                try:
                    # Try using the contract's event filter first
                    events = self.game_contract.events.GameStarted.get_logs(
                        fromBlock=from_block,
                        toBlock=current_block
                    )
                    
                    for event in events:
                        try:
                            # Event is already decoded
                            decoded_log = event
                            
                            game_id = decoded_log['args']['gameId']
                            player = decoded_log['args']['player']
                            burned_amount = decoded_log['args']['burnedAmount']
                            game_type = decoded_log['args']['gameType']
                            
                            # Skip if already processed
                            if game_id in processed_games:
                                continue
                            
                            print(f"\n🤖 SimpleGameBot: 🎮 New game detected!")
                            print(f"🤖 SimpleGameBot: 🆔 Game ID: {game_id}")
                            print(f"🤖 SimpleGameBot: 👤 Player: {player}")
                            print(f"🤖 SimpleGameBot: 🔥 Burned: {self.w3.from_wei(burned_amount, 'ether')} BBT")
                            print(f"🤖 SimpleGameBot: 🎯 Type: {game_type}")
                            
                            # Preview potential rewards for all outcomes
                            outcomes = [0, 1, 2, 3]  # PLAYER_VICTORY, AI_VICTORY, DRAW, EPIC_VICTORY
                            outcome_names = ["PLAYER_VICTORY", "AI_VICTORY", "DRAW", "EPIC_VICTORY"]
                            
                            print(f"🤖 SimpleGameBot: 💰 Potential AVAX rewards:")
                            for i, outcome in enumerate(outcomes):
                                potential = self._calculate_potential_reward(burned_amount, game_type, outcome)
                                reward_avax = self.w3.from_wei(potential, 'ether')
                                print(f"🤖 SimpleGameBot:   - {outcome_names[i]}: {reward_avax:.6f} AVAX")
                            
                            # Add thinking delay (1-5 seconds) to make it feel more realistic
                            thinking_time = random.randint(1, 5)
                            print(f"🤖 SimpleGameBot: 🧠 AI is thinking... ({thinking_time}s)")
                            time.sleep(thinking_time)
                            
                            # Complete the game
                            success = self.complete_game(game_id, game_type, burned_amount)
                            
                            if success:
                                processed_games.add(game_id)
                            
                            print(f"🤖 SimpleGameBot: ⏭️ Continuing to monitor for new games...\n")
                        
                        except Exception as event_error:
                            print(f"🤖 SimpleGameBot: ⚠️ Error processing event: {event_error}")
                            continue
                    
                except Exception as log_error:
                    print(f"🤖 SimpleGameBot: ⚠️ Error getting events: {log_error}")
                    
                    # Fallback: try polling method if event filtering fails
                    try:
                        # Check recent transactions to/from the contract
                        print(f"🤖 SimpleGameBot: 🔄 Trying fallback polling method...")
                        
                        # Simple fallback - just wait and check again
                        time.sleep(5)
                        continue
                        
                    except Exception as fallback_error:
                        print(f"🤖 SimpleGameBot: ⚠️ Fallback method also failed: {fallback_error}")
                        # Continue the main loop
                
                # Update latest block
                if current_block > latest_block:
                    latest_block = current_block
                
                # Short sleep to avoid hammering the RPC
                time.sleep(3)
                
            except KeyboardInterrupt:
                print(f"\n🤖 SimpleGameBot: 🛑 Stopping bot...")
                break
            except Exception as e:
                print(f"🤖 SimpleGameBot: ⚠️ Error in event loop: {e}")
                print(f"🤖 SimpleGameBot: 🔄 Retrying in 10 seconds...")
                time.sleep(10)  # Wait before retrying
    
    def test_connection(self):
        """Test the bot's connection and setup"""
        try:
            print(f"🤖 SimpleGameBot: 🧪 Testing connection...")
            
            # Check balance
            balance = self.w3.eth.get_balance(self.account.address)
            balance_avax = self.w3.from_wei(balance, 'ether')
            print(f"🤖 SimpleGameBot: 💰 Bot balance: {balance_avax:.6f} AVAX")
            
            # Check if we can read from the contract
            current_block = self.w3.eth.block_number
            print(f"🤖 SimpleGameBot: 📦 Current block: {current_block}")
            
            # Check reward pool
            self._check_reward_pool()
            
            # Test event topic calculation
            try:
                # Test getting recent events to verify contract is working
                recent_events = self.game_contract.events.GameStarted.get_logs(
                    fromBlock=current_block - 100,
                    toBlock=current_block
                )
                print(f"🤖 SimpleGameBot: 📊 Found {len(recent_events)} recent GameStarted events")
            except Exception as event_test_error:
                print(f"🤖 SimpleGameBot: ⚠️ Event test warning: {event_test_error}")
                print(f"🤖 SimpleGameBot: 🔧 Bot will use fallback methods if needed")
            
            # Test reward calculation
            try:
                test_reward = self.game_contract.functions.calculatePotentialReward(
                    self.w3.to_wei(1000, 'ether'),  # 1000 tokens
                    0,  # QUICK_BATTLE
                    0   # PLAYER_VICTORY
                ).call()
                test_avax = self.w3.from_wei(test_reward, 'ether')
                print(f"🤖 SimpleGameBot: 🧪 Test reward calculation: {test_avax:.6f} AVAX")
            except Exception as calc_error:
                print(f"🤖 SimpleGameBot: ⚠️ Reward calculation test failed: {calc_error}")
            
            print(f"🤖 SimpleGameBot: ✅ Connection test passed!")
            return True
            
        except Exception as e:
            print(f"🤖 SimpleGameBot: ❌ Connection test failed: {e}")
            return False


def main():
    """Main entry point"""
    print("🤖 SimpleGameBot: Starting BigBrain Battle Arena AI with AVAX rewards...")
    
    # Configuration
    RPC_URL = "https://avax-fuji.g.alchemy.com/v2/7NBTdVMFlqXaf5D-r-0kb73aehWeZ1Aj"
    GAME_CONTRACT_ADDRESS = "0x7D56425650a0EFf5111c79c39A27319Ca45138a1"  # Update this!
    
    # You'll need to set your private key here
    PRIVATE_KEY = input("🔑 Enter your private key (or set BOT_PRIVATE_KEY env var): ").strip()
    if not PRIVATE_KEY:
        import os
        PRIVATE_KEY = os.getenv('BOT_PRIVATE_KEY')
    
    if not PRIVATE_KEY:
        print("❌ Private key required!")
        return
    
    try:
        # Initialize bot
        bot = SimpleGameBot(RPC_URL, PRIVATE_KEY, GAME_CONTRACT_ADDRESS)
        
        # Test connection
        if not bot.test_connection():
            print("❌ Connection test failed, exiting...")
            return
        
        # Ask if user wants to fund the reward pool
        try:
            fund_amount = input("💰 Enter AVAX amount to fund reward pool (or press Enter to skip): ").strip()
            if fund_amount:
                fund_amount_float = float(fund_amount)
                if fund_amount_float > 0:
                    success = bot.deposit_avax_to_pool(fund_amount_float)
                    if not success:
                        print("⚠️ Failed to fund pool, but continuing anyway...")
        except ValueError:
            print("⚠️ Invalid amount, skipping funding...")
        
        # Start listening
        print(f"🤖 SimpleGameBot: 🚀 Bot is ready to battle with AVAX rewards!")
        bot.listen_for_games()
        
    except KeyboardInterrupt:
        print(f"\n🤖 SimpleGameBot: 👋 Goodbye!")
    except Exception as e:
        print(f"🤖 SimpleGameBot: 💥 Critical error: {e}")


if __name__ == "__main__":
    main()