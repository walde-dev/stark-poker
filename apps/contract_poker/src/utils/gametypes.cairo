mod gamestates {
    #[derive(Copy, Drop, Serde, starknet::Store, PartialEq)]
    struct CardWrapper {
        card: u8,
        encryptedBy1: u8,
        encryptedBy2: u8,
        clearvalue: u8,
        owner: u8
    }
    #[derive(Copy, Drop, Serde, starknet::Store, PartialEq)]
    enum GameState {
        Opening,
        Betting,
        Encryption1,
        Encryption2,
        Ready,
        DrawHouse,
        HouseDrawn,
        Player1,
        Player2,
        Bank,
        Solve,
        Ended
    }
}
