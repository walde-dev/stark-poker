use contract_poker::utils::gametypes::gamestates::CardWrapper;

#[starknet::interface]
trait ICardContract<TContractState> {
    fn writeC(ref self: TContractState, index: u8) -> u8;
    fn readC(self: @TContractState, index: u8) -> CardWrapper;
    fn readCardStack(self: @TContractState) -> Array<CardWrapper>;
    fn readEncryptedCardStack(self: @TContractState) -> Array<CardWrapper>;
    fn initStack(ref self: TContractState) -> ();
    fn setEncryptedCards(ref self: TContractState, playerId: u8, encryptedCards: Array<u8>) -> ();
    fn setDecryptedCard(ref self: TContractState, playerId: u8, cardId: u8, card: u8) -> ();
    fn setReady(ref self: TContractState, playerId: u8) -> ();
    fn setDecryptBank(ref self: TContractState, playerId: u8) -> ();
    fn stand(ref self: TContractState, playerId: u8) -> ();
    fn decryptAll(ref self: TContractState, playerId: u8, decryptedCards: Array<u8>) -> ();
    fn lastWinners(self: @TContractState) -> Array<u8>;
    fn reset(ref self: TContractState) -> ();
    fn submitKey(ref self: TContractState, playerId: u8, key: u8) -> ();
}

#[starknet::contract]
mod CardContract {
    use core::array::ArrayTrait;
    use core::traits::Into;
    use core::starknet::event::EventEmitter;
    use starknet::get_caller_address;


    use contract_poker::utils::gametypes::gamestates::CardWrapper;
    use contract_poker::utils::gametypes::gamestates::GameState;
    use contract_poker::utils::gamelogic::gamelogic::cardStackValue;

    use starknet::{ContractAddress};
    #[storage]
    struct Storage {
        cards: LegacyMap<u8, CardWrapper>,
        encryptedCards: LegacyMap<u8, CardWrapper>,
        gameState: GameState,
        // houseCards: LegacyMap<u8, CardWrapper>,
        decryptionResonsible: u8,
        housePoints: u8,
        player1Points: u8,
        player2Points: u8,
        keys: LegacyMap<u8, u8>,
    }
    #[event]
    #[derive(Drop, starknet::Event)]
    enum Event {
        TakenCards: TakenCards,
        InitedStack: InitedStack,
        EncryptedStack: EncryptedStack,
        GameDone: GameDone,
    }

    #[derive(Drop, starknet::Event)]
    struct TakenCards {
        #[key]
        user: ContractAddress,
        id: u8
    }
    #[derive(Drop, starknet::Event)]
    struct InitedStack {
        #[key]
        user: ContractAddress
    }

    #[derive(Drop, starknet::Event)]
    struct EncryptedStack {
        #[key]
        user: ContractAddress,
        user1: u8,
        user2: u8,
    }

    #[derive(Drop, starknet::Event)]
    struct GameDone {
        #[key]
        houePoints: u8,
        user1points: u8,
        user2points: u8,
    }

    #[external(v0)]
    impl CardContract of super::ICardContract<ContractState> {
        fn writeC(ref self: ContractState, index: u8) -> u8 {
            self.emit(TakenCards { user: get_caller_address(), id: index });
            index
        }
        fn readC(self: @ContractState, index: u8) -> CardWrapper {
            self.cards.read(index)
        }
        fn readCardStack(self: @ContractState) -> Array<CardWrapper> {
            let mut output = ArrayTrait::new();
            let mut i = 0;
            let ze: CardWrapper = CardWrapper {
                card: 0_u8, encryptedBy1: 0, encryptedBy2: 0, clearvalue: 0, owner: 0
            };
            loop {
                let value = self.cards.read(i);
                if value == ze {
                    break;
                };
                output.append(value);
                i += 1;
            };
            output
        }
        fn readEncryptedCardStack(self: @ContractState) -> Array<CardWrapper> {
            let mut output = ArrayTrait::new();
            let mut i = 0;
            let ze: CardWrapper = CardWrapper {
                card: 0_u8, encryptedBy1: 0, encryptedBy2: 0, clearvalue: 0, owner: 0
            };
            loop {
                let value = self.encryptedCards.read(i);
                if value == ze {
                    break;
                };
                output.append(value);
                i += 1;
            };
            output
        }
        fn initStack(ref self: ContractState) {
            let mut i: u8 = 1;
            loop {
                let ze: CardWrapper = CardWrapper {
                    card: i, encryptedBy1: 0, encryptedBy2: 0, clearvalue: i, owner: 0
                };
                self.cards.write((i - 1).into(), ze);
                i += 1;
                if i == 53 {
                    break;
                }
            };
            self.emit(InitedStack { user: get_caller_address() });
        }
        fn setEncryptedCards(ref self: ContractState, playerId: u8, encryptedCards: Array<u8>) {
            let mut i: u8 = 0;

            let setLen = encryptedCards.len();
            loop {
                let mut owner = 7;
                if (i < 2) {
                    owner = 3;
                } else if (i < 4) {
                    owner = 1;
                } else if (i < 6) {
                    owner = 2;
                }
                let mut e1 = self.encryptedCards.read(i.into()).encryptedBy1;
                let mut e2 = self.encryptedCards.read(i.into()).encryptedBy2;
                if (playerId == 1) {
                    e1 = 1;
                }
                if (playerId == 2) {
                    e2 = 1;
                }
                let ze: CardWrapper = CardWrapper {
                    card: *encryptedCards.at(i.into()),
                    encryptedBy1: e1,
                    encryptedBy2: e2,
                    clearvalue: 0,
                    owner: owner
                };
                self.encryptedCards.write(i.into(), ze);
                i += 1;
                if i == 52 || i.into() == setLen {
                    break;
                }
            };
            self
                .emit(
                    EncryptedStack { user: get_caller_address(), user1: playerId, user2: playerId }
                );
            if (playerId > 0) {
                self.gameState.write(GameState::Encryption1);
            }
            if (playerId > 1) {
                self.gameState.write(GameState::Encryption2);
            }
        }
        fn setReady(ref self: ContractState, playerId: u8) {
            self.gameState.write(GameState::Ready);
        }

        fn setDecryptedCard(ref self: ContractState, playerId: u8, cardId: u8, card: u8) {
            let card = self.encryptedCards.read(cardId.into());
            let mut e1 = card.encryptedBy1;
            let mut e2 = card.encryptedBy2;
            assert(
                (card.encryptedBy1 == 1
                    && playerId == 1 || card.encryptedBy2 == 1
                    && playerId == 2),
                'cant decrypt decrypted card'
            );
            if (playerId == 1) {
                e1 = 0;
            }
            if (playerId == 2) {
                e2 = 0;
            }
            self
                .encryptedCards
                .write(
                    cardId.into(),
                    CardWrapper {
                        card: card.card,
                        encryptedBy1: e1,
                        encryptedBy2: e2,
                        clearvalue: card.clearvalue,
                        owner: card.owner
                    }
                );
        }
        fn setDecryptBank(ref self: ContractState, playerId: u8) {
            assert(playerId == 1, 'player1 needs to decrypt');
            self.gameState.write(GameState::HouseDrawn);
        }
        fn stand(ref self: ContractState, playerId: u8) {
            self.gameState.write(GameState::Solve);
        }
        fn decryptAll(ref self: ContractState, playerId: u8, decryptedCards: Array<u8>) {
            assert(playerId - 1 == self.decryptionResonsible.read(), 'not your turn');
            let mut i: u8 = 0;

            let setLen = decryptedCards.len();
            loop {
                let card = self.encryptedCards.read(i.into());
                let mut e1 = card.encryptedBy1;
                let mut e2 = card.encryptedBy2;
                if (playerId == 1) {
                    e1 = 0;
                }
                if (playerId == 2) {
                    e2 = 0;
                }
                let newValue = *decryptedCards.at(i.into());
                assert(
                    !(playerId == 2 && card.encryptedBy2 == 0 && card.card != newValue)
                        && !(playerId == 1 && card.encryptedBy2 != e2 && card.card != newValue),
                    'wrong decryption'
                );
                let ze: CardWrapper = CardWrapper {
                    card: newValue,
                    encryptedBy1: e1,
                    encryptedBy2: e2,
                    clearvalue: 0,
                    owner: card.owner
                };
                self.encryptedCards.write(i.into(), ze);
                i += 1;
                if i == 53 || i.into() == setLen {
                    break;
                }
            };
            self.decryptionResonsible.write(self.decryptionResonsible.read() + 1);
            if (self.decryptionResonsible.read() == 2) {
                self.gameState.write(GameState::Ended);
                let mut houseHand: Array<u8> = ArrayTrait::new();
                let mut p1Hand: Array<u8> = ArrayTrait::new();
                let mut p2Hand: Array<u8> = ArrayTrait::new();
                let mut i: u8 = 1;
                loop {
                    let card = self.encryptedCards.read(i.into());
                    if (card.owner == 1) {
                        p1Hand.append(card.card);
                    }
                    if (card.owner == 2) {
                        p2Hand.append(card.card);
                    }
                    if (card.owner == 3) {
                        houseHand.append(card.card);
                    }
                    i += 1;
                    if i == 53 {
                        break;
                    }
                };

                self.housePoints.write(cardStackValue(houseHand));
                self.player1Points.write(cardStackValue(p1Hand));
                self.player2Points.write(cardStackValue(p2Hand));
                self
                    .emit(
                        GameDone {
                            houePoints: self.housePoints.read(),
                            user1points: self.player1Points.read(),
                            user2points: self.player2Points.read()
                        }
                    );
            }
        }
        fn lastWinners(self: @ContractState) -> Array<u8> {
            let mut output = ArrayTrait::new();
            output.append(self.housePoints.read());
            output.append(self.player1Points.read());
            output.append(self.player2Points.read());
            output
        }
        fn reset(ref self: ContractState) {
            self
                .cards
                .write(
                    0,
                    CardWrapper {
                        card: 0_u8, encryptedBy1: 0, encryptedBy2: 0, clearvalue: 0, owner: 0
                    }
                );
            self
                .encryptedCards
                .write(
                    0,
                    CardWrapper {
                        card: 0_u8, encryptedBy1: 0, encryptedBy2: 0, clearvalue: 0, owner: 0
                    }
                );
            self.gameState.write(GameState::Betting);
            self.decryptionResonsible.write(0);
            self.housePoints.write(0);
            self.player1Points.write(0);
            self.player2Points.write(0);
            self.keys.write(0, 0);
            self.keys.write(1, 0);
        }
        fn submitKey(ref self: ContractState, playerId: u8, key: u8) -> () {
            self.keys.write(playerId, key);
        }
    }
}
