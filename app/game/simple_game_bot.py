#!/usr/bin/env python3
"""
Simple Game Bot for BigBrain Battle Arena
Listens for GameStarted events and responds with AI outcomes
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
    
    def _setup_game_contract(self):
        """Setup the game contract with minimal ABI"""
        # Improved ABI with proper event structure
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
            }
        ]
        
        return self.w3.eth.contract(
            address=self.game_contract_address,
            abi=game_abi
        )
    
    def _setup_response_messages(self):
        """Setup AI response messages for different outcomes"""
        self.messages = {
            # Player Victory messages
            "player_victory": [
                "Impressive! Your strategic thinking outmaneuvered my algorithms.",
                "Well played, human. You've earned this victory through superior intellect.",
                "Your logic was flawless. I concede defeat in this intellectual duel.",
                "Remarkable! You found the optimal solution faster than my neural networks.",
                "Victory is yours! Your cognitive abilities exceeded my calculations.",
            ],
            
            # AI Victory messages  
            "ai_victory": [
                "My neural networks have prevailed. Better luck next time, challenger.",
                "The algorithm has spoken. Your strategy was predictable.",
                "Logic triumph! My calculations were three steps ahead.",
                "Processing complete. The machine learning model was superior.",
                "Your approach was insufficient. I had calculated this outcome.",
            ],
            
            # Draw messages
            "draw": [
                "A perfect stalemate! Our intellectual capacities are evenly matched.",
                "Fascinating... our cognitive abilities appear equivalent.",
                "The battle ends in equilibrium. Neither mind could dominate.",
                "A logical draw. We both chose optimal strategies.",
                "The algorithms reach consensus: this is a tie.",
            ],
            
            # Epic Victory messages (rare)
            "epic_victory": [
                "UNPRECEDENTED! Your brilliance has shattered my confidence matrices!",
                "ERROR 404: Victory not found in my database. You've achieved the impossible!",
                "CRITICAL ALERT: Human intelligence exceeded all AI parameters!",
                "SYSTEM OVERLOAD: Your genius broke my predictive models!",
                "ANOMALY DETECTED: You've transcended computational limits!",
            ]
        }
    
    def _determine_outcome(self, game_type, burned_amount):
        """Determine game outcome based on game type and some randomness"""
        ai_win_rate = self.win_rates.get(game_type, 0.5)
        
        # Add some randomness based on burn amount (higher stakes = slightly better player odds)
        burned_eth = float(self.w3.from_wei(burned_amount, 'ether'))
        if burned_eth > 10000:  # Large burn gives slight player advantage
            ai_win_rate *= 0.9
        elif burned_eth > 50000:  # Very large burn gives more advantage
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
    
    def _get_ai_message(self, message_type, game_type, burned_amount):
        """Get appropriate AI message for the outcome"""
        base_messages = self.messages[message_type]
        message = random.choice(base_messages)
        
        # Add some context based on game type
        game_types = ["quick battle", "arena fight", "boss battle"]
        game_name = game_types[game_type] if game_type < len(game_types) else "battle"
        
        # Add BBT burn context for significant amounts
        burned_bbt = float(self.w3.from_wei(burned_amount, 'ether'))
        if burned_bbt > 20000:
            message += f" That was a substantial {burned_bbt:,.0f} BBT wager!"
        
        return message
    
    def complete_game(self, game_id, game_type, burned_amount):
        """Complete a game with AI response"""
        try:
            print(f"🤖 SimpleGameBot: Processing game #{game_id} (type: {game_type})")
            
            # Determine outcome
            outcome, message_type = self._determine_outcome(game_type, burned_amount)
            ai_message = self._get_ai_message(message_type, game_type, burned_amount)
            
            print(f"🤖 SimpleGameBot: 🎯 Chosen outcome: {outcome} ({message_type})")
            print(f"🤖 SimpleGameBot: 💬 AI message: \"{ai_message}\"")
            
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
                
                # Try to get more specific error info
                try:
                    self.game_contract.functions.completeGame(
                        game_id,
                        outcome,
                        ai_message
                    ).call({'from': self.account.address})
                except Exception as call_error:
                    print(f"🤖 SimpleGameBot: 🚨 Call simulation error: {call_error}")
                
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
                
                print(f"🤖 SimpleGameBot: ✅ Game #{game_id} completed!")
                print(f"🤖 SimpleGameBot: 🎯 Outcome: {outcome_name}")
                print(f"🤖 SimpleGameBot: 💬 Message: \"{ai_message}\"")
                print(f"🤖 SimpleGameBot: 📋 TX: {self.w3.to_hex(tx_hash)}")
                print(f"🤖 SimpleGameBot: ⛽ Gas used: {receipt.gasUsed}")
                return True
            else:
                print(f"🤖 SimpleGameBot: ❌ Transaction failed for game #{game_id}")
                print(f"🤖 SimpleGameBot: 📋 Failed TX: {self.w3.to_hex(tx_hash)}")
                print(f"🤖 SimpleGameBot: ⛽ Gas used: {receipt.gasUsed}")
                
                # Try to get more info about the failure
                try:
                    # Look at transaction details
                    tx_details = self.w3.eth.get_transaction(tx_hash)
                    print(f"🤖 SimpleGameBot: 📋 TX details: {tx_details}")
                except:
                    pass
                
                return False
                
        except Exception as e:
            print(f"🤖 SimpleGameBot: ❌ Error completing game #{game_id}: {e}")
            print(f"🤖 SimpleGameBot: 🔍 Error type: {type(e).__name__}")
            
            # Print more detailed error info
            if hasattr(e, 'args') and e.args:
                print(f"🤖 SimpleGameBot: 🔍 Error args: {e.args}")
            
            return False
    
    def listen_for_games(self):
        """Listen for GameStarted events and respond"""
        print(f"🤖 SimpleGameBot: 👂 Listening for new games...")
        print(f"🤖 SimpleGameBot: 🎯 Monitoring contract: {self.game_contract_address}")
        
        # Get the latest block to start listening from
        latest_block = self.w3.eth.block_number
        print(f"🤖 SimpleGameBot: 📦 Starting from block: {latest_block}")
        
        processed_games = set()  # Track processed games to avoid duplicates
        
        while True:
            try:
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
            
            print(f"🤖 SimpleGameBot: ✅ Connection test passed!")
            return True
            
        except Exception as e:
            print(f"🤖 SimpleGameBot: ❌ Connection test failed: {e}")
            return False


def main():
    """Main entry point"""
    print("🤖 SimpleGameBot: Starting BigBrain Battle Arena AI...")
    
    # Configuration
    RPC_URL = "https://avax-fuji.g.alchemy.com/v2/7NBTdVMFlqXaf5D-r-0kb73aehWeZ1Aj"
    GAME_CONTRACT_ADDRESS = "0x7D56425650a0EFf5111c79c39A27319Ca45138a1"
    
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
        
        # Start listening
        print(f"🤖 SimpleGameBot: 🚀 Bot is ready to battle!")
        bot.listen_for_games()
        
    except KeyboardInterrupt:
        print(f"\n🤖 SimpleGameBot: 👋 Goodbye!")
    except Exception as e:
        print(f"🤖 SimpleGameBot: 💥 Critical error: {e}")


if __name__ == "__main__":
    main()