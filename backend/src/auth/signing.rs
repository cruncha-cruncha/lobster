use jsonwebtoken::{DecodingKey, EncodingKey};
use once_cell::sync::Lazy;
use std::{fs, io::Read};

static PUBLIC_FILE_PATH: &'static str = "./public.pem";
static PRIVATE_FILE_PATH: &'static str = "./private.pem";

#[allow(dead_code)]
pub const ALGORITHM: jsonwebtoken::Algorithm = jsonwebtoken::Algorithm::RS256;

#[allow(dead_code)]
pub const PUBLIC_KEY: Lazy<jsonwebtoken::DecodingKey> = Lazy::new(|| {
    let bytes = get_pem_bytes(&PUBLIC_FILE_PATH);
    return DecodingKey::from_rsa_pem(&bytes).expect("Failed to make public key");
});

#[allow(dead_code)]
pub const PRIVATE_KEY: Lazy<jsonwebtoken::EncodingKey> = Lazy::new(|| {
    let bytes = get_pem_bytes(&PRIVATE_FILE_PATH);
    return EncodingKey::from_rsa_pem(&bytes).expect("Failed to make private key");
});

fn get_pem_bytes(path: &str) -> Vec<u8> {
    let mut buffer = Vec::new();
    let mut f = fs::File::open(path).expect(&format!("Failed to open file {}", path));
    f.read_to_end(&mut buffer).expect(&format!("Failed to read file {}", path));

    buffer
}
