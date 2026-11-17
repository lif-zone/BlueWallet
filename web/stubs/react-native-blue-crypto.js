// react-native-blue-crypto for web: scrypt from @noble/hashes.
// scrypt over hex-encoded password and salt; resolves to the hex-encoded key
import {scryptAsync} from '@noble/hashes/scrypt';
import {hexToBytes, bytesToHex} from '@noble/hashes/utils';

export async function scrypt(password_hex, salt_hex, N, r, p, dkLen){
  let key = await scryptAsync(hexToBytes(password_hex), hexToBytes(salt_hex),
    {N, r, p, dkLen});
  return bytesToHex(key);
}

export default {scrypt};
