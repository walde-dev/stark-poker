mod gamelogic {
    //cards are as follows:
    //0-9 : A-10 VALUE: 1-10
    //*4
    //0-39 %10 = value
    //11-13 : J-K VALUE: 10
    //41-52 = 10

    use core::traits::Into;
    use array::ArrayTrait;

    //alternative in decks of 4 colors each 13 cards
    //A...10 JQK
    //CARDS 1-13 
    fn cardToValue(card: @u8) -> u8 {
        if *card % 13 == 0 {
            return 11;
        } else if *card % 13 > 9 {
            return 10;
        } else {
            return *card % 13;
        }
    }

    fn cardStackValue(stack: Array<u8>) -> u8 {
        let mut counter: u32 = 0;
        let mut sum: u8 = 0;
        loop {
            if (counter >= stack.len()) {
                break;
            }
            sum += cardToValue(stack.at(counter));
            counter += 1;
        };
        sum
    }

    fn cardStackValid(stack: Array<u8>) -> bool {
        cardStackValue(stack) <= 21_u8
    }

    fn cardStackBigger(stack1: Array<u8>, stack2: Array<u8>) -> bool {
        cardStackValue(stack1) > cardStackValue(stack2)
    }
}
