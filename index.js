const { randomBytes, createHash } = require('crypto')
const { privateKeyVerify, publicKeyCreate } = require('secp256k1')
const { encode } = require('base-58')

const privateKeyCreate = () => {
  while (true) {
    const bytes = randomBytes(32)
    if (privateKeyVerify(bytes)) return bytes
  }
}

const digest = (bytes, algorithm) => {
  const hash = createHash(algorithm)
  hash.update(bytes)
  return hash.digest()
}

const ripemd160 = bytes => digest(bytes, 'ripemd160')

const sha256 = bytes => digest(bytes, 'sha256')

const generateBitcoinAddress = (prefix = '1') => {
  prefix = prefix.toLowerCase()
  while (true) {
    // 秘密鍵のバイト列を生成
    const privateKeyBytes = privateKeyCreate()

    // 公開鍵のバイト列を生成
    const publicKeyBytes = Buffer.from(publicKeyCreate(privateKeyBytes))

    // sha256とripemd160を適用したハッシュ値(=ウォレットアドレス)を生成
    const addressBytes = ripemd160(sha256(publicKeyBytes))

    // ウォレットアドレスにプレフィクスを追加(0x00=0固定)
    const addressPrefixAdded = Buffer.concat([Buffer.alloc(1, 0), addressBytes])

    // 秘密鍵にプレフィクスを追加(メインネット=0x10=128, テストネット=0xEF=239, オプションで0x01=1を末尾につけてもOK)
    const privateKeyPrefixAdded = Buffer.concat([Buffer.alloc(1, 128), privateKeyBytes/*, Buffer.alloc(1, 1) */])

    // ウォレットアドレスにチェックディジット(sha256を２回適用したハッシュ値の先頭4バイト)を追加
    const addressCheckAdded = Buffer.concat([addressPrefixAdded, sha256(sha256(addressPrefixAdded))], addressPrefixAdded.byteLength + 4)

    // 秘密鍵にチェックディジット(sha256を２回適用したハッシュ値の先頭4バイト)を追加
    const privateKeyCheckAdded = Buffer.concat([privateKeyPrefixAdded, sha256(sha256(privateKeyPrefixAdded))], privateKeyPrefixAdded.byteLength + 4)

    // base58でエンコードしてウォレットアドレス完成
    const address = encode(addressCheckAdded)

    // base58でエンコードして秘密鍵完成
    const privateKey = encode(privateKeyCheckAdded)

    if (address.toLowerCase().startsWith(prefix)) {
      return { publicKeyBytes, addressBytes, addressPrefixAdded, addressCheckAdded, address, privateKeyBytes, privateKeyPrefixAdded, privateKeyCheckAdded, privateKey }
    }
  }
}

console.log(generateBitcoinAddress(process.argv[2] || ''))
