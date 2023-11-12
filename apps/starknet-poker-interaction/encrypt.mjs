export function encrypt(number, key) {
  return Number.parseInt(number) ^ key;
}
export function decrypt(number, key) {
  return Number.parseInt(number) ^ key;
}

export function cryptAll(numbers, key) {
  return numbers.map((number) => encrypt(number, key));
}

// function test() {
//   const key1 = 23;
//   const key2 = 24;

//   let val = 21;
//   let vale1 = encrypt(val, key1);
//   let vale2 = encrypt(vale1, key2);
//   console.log(
//     "CIPHER",
//     val,
//     vale1,
//     vale2,
//     "->",
//     decrypt(vale1, key1),
//     decrypt(vale2, key2)
//   );
//   console.log("DECIPHER", decrypt(decrypt(vale2, key2), key1));
//   console.log("DECIPHER", decrypt(decrypt(vale2, key1), key2));

//   return;
// }
