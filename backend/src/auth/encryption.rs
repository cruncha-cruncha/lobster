use aes_gcm::{
    aead::{consts::U12, Aead, KeyInit},
    Aes256Gcm, Key, Nonce,
};
use once_cell::sync::Lazy;
use rand::Rng;

#[allow(dead_code)]
const AES_CIPHER: Lazy<Aes256Gcm> = Lazy::new(|| {
    let mut bytes = [0u8; 32];
    let hex_key = std::env::var("AES_KEY").expect("missing AES_KEY in .env");
    match hex::decode_to_slice(hex_key, &mut bytes) {
        Ok(_) => {}
        Err(e) => {
            panic!("ERROR auth_aes_cipher_lazy_hex_decode, {}", e);
        }
    };

    let key: &Key<Aes256Gcm> = &bytes.into();
    Aes256Gcm::new(&key)
});

#[allow(dead_code)]
const AES_NONCE: Lazy<Nonce<U12>> = Lazy::new(|| {
    let mut bytes = [0u8; 12];
    let hex_nonce = std::env::var("AES_NONCE").expect("missing AES_NONCE in .env");
    match hex::decode_to_slice(hex_nonce, &mut bytes) {
        Ok(_) => bytes.into(),
        Err(e) => {
            panic!("ERROR auth_aes_nonce_lazy_hex_decode, {}", e);
        }
    }
});

pub fn generate_salt() -> [u8; 32] {
    rand::thread_rng().gen::<[u8; 32]>()
}

pub fn hash_password(password: &str, salt: &[u8]) -> [u8; 32] {
    let mut out = [0u8; 32];
    pbkdf2::pbkdf2_hmac::<sha2::Sha256>(password.as_bytes(), salt, 20000, &mut out);
    out
}

pub fn encode_plain_email(email: &str) -> Option<Vec<u8>> {
    match AES_CIPHER.encrypt(&AES_NONCE, email.to_lowercase().as_bytes()) {
        Ok(vec) => Some(vec),
        Err(e) => {
            eprintln!("ERROR auth_encode_plain_email, {}", e);
            None
        }
    }
}

pub fn decode_email(email: &[u8]) -> Option<String> {
    let vec = match AES_CIPHER.decrypt(&AES_NONCE, email) {
        Ok(vec) => vec,
        Err(e) => {
            eprintln!("ERROR auth_decode_email_1, {}", e);
            return None;
        }
    };

    match String::from_utf8(vec) {
        Ok(s) => Some(s),
        Err(e) => {
            eprintln!("ERROR auth_decode_email_2, {}", e);
            None
        }
    }
}
