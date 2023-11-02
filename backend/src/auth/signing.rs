use jsonwebtoken::{DecodingKey, EncodingKey};
use once_cell::sync::Lazy;
use std::{fs, io::Read};

static PUBLIC_FILE_PATH: &'static str = "./public.pem";
static PRIVATE_FILE_PATH: &'static str = "./private.pem";

#[allow(dead_code)]
pub const ALGORITHM: jsonwebtoken::Algorithm = jsonwebtoken::Algorithm::RS256;

#[allow(dead_code)]
pub const PUBLIC_KEY: Lazy<jsonwebtoken::DecodingKey> = Lazy::new(|| {
    let bytes = get_jwt_public_key_pem_bytes();
    return DecodingKey::from_rsa_pem(&bytes).expect("Failed to make public key");
});

#[allow(dead_code)]
pub const PRIVATE_KEY: Lazy<jsonwebtoken::EncodingKey> = Lazy::new(|| {
    let bytes = get_jwt_private_key_pem_bytes();
    return EncodingKey::from_rsa_pem(&bytes).expect("Failed to make private key");
});

pub fn get_jwt_public_key_pem_bytes() -> Vec<u8> {
    let mut buffer = Vec::new();
    let mut f = fs::File::open(PUBLIC_FILE_PATH).expect(&format!("Failed to open file {}", PUBLIC_FILE_PATH));
    f.read_to_end(&mut buffer).expect(&format!("Failed to read file {}", PUBLIC_FILE_PATH));

    buffer
}

pub fn get_jwt_private_key_pem_bytes() -> Vec<u8> {
    let mut buffer = Vec::new();
    let mut f = fs::File::open(PRIVATE_FILE_PATH).expect(&format!("Failed to open file {}", PRIVATE_FILE_PATH));
    f.read_to_end(&mut buffer).expect(&format!("Failed to read file {}", PRIVATE_FILE_PATH));

    buffer
}
