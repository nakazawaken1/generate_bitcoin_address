# ビットコインアドレス生成(Generate bitcoin address)

## 使い方(Usage)
node index.js [prefix]

prefixで始まるアドレスを生成する（先頭は必ず1）
Generate an address starting with prefix (be sure to start with 1).

[実行例(Example)]

```
% node index.js 1abc                               
{
  publicKeyBytes: <Buffer 02 e7 39 d9 00 0f 2d 05 c6 d7 dd 73 f8 b1 11 ed 13 99 b1 56 4a 0b 8a bb a8 ca 36 f8 d7 5a d3 6d 69>,
  addressBytes: <Buffer 64 ba 88 93 6d 15 cc 4f aa 6b ab e0 d1 c1 5a 04 37 93 3c e6>,
  addressPrefixAdded: <Buffer 00 64 ba 88 93 6d 15 cc 4f aa 6b ab e0 d1 c1 5a 04 37 93 3c e6>,
  addressCheckAdded: <Buffer 00 64 ba 88 93 6d 15 cc 4f aa 6b ab e0 d1 c1 5a 04 37 93 3c e6 0a 7e e0 f9>,
  address: '1ABc2kxFjf7gidV2Z6jqGVeYvHQBcnCVov',
  privateKeyBytes: <Buffer d5 40 96 e4 d0 b0 7b 10 39 15 85 92 de e8 b8 c6 d2 54 56 54 ad c0 b7 d7 30 ac 77 d4 11 9e a2 8b>,
  privateKeyPrefixAdded: <Buffer 80 d5 40 96 e4 d0 b0 7b 10 39 15 85 92 de e8 b8 c6 d2 54 56 54 ad c0 b7 d7 30 ac 77 d4 11 9e a2 8b>,
  privateKeyCheckAdded: <Buffer 80 d5 40 96 e4 d0 b0 7b 10 39 15 85 92 de e8 b8 c6 d2 54 56 54 ad c0 b7 d7 30 ac 77 d4 11 9e a2 8b c9 a9 9b 50>,
  privateKey: '5KSCppmRSuKdbVKdovedKyXhNEJo7qnwE7CU91SqUDxqFmZmBPD'
}
```

[処理概要(Outline)]

- secp256k1 でキーペア作成
  (Create key pair by secp256k1.)
- 公開鍵を sha256, hash160 にかけアドレスを作る
  (Create an address by applying the public key to sha256 and hash160.)
- アドレスの先頭にバイト値0をつけ、末尾に sha256 を2回かけたハッシュ値の先頭4バイトをつけ、base58でエンコードすれば1から始まるWIF形式のアドレスの完成
  (Add a byte value of 0 to the beginning of the address, add the first 4 bytes of the hash value obtained by multiplying sha256 twice at the end, and encode with base58 to complete the WIF format address starting from 1.)
- 秘密鍵の先頭にバイト値0x10(128)(テストネットの場合は0xEF=237)をつけ、末尾に sha256 を2回かけたハッシュ値の先頭4バイトをつけ、base58でエンコードすれば5から始まるWIF形式の秘密鍵が完成
  (Add the byte value 0x10 (128) (0xEF = 237 for the testnet) to the beginning of the private key, add the first 4 bytes of the hash value multiplied by sha256 twice to the end, and if you encode with base58, WIF starting from 5 Completed private key of format.)