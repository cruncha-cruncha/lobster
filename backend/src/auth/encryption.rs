use rand::Rng;

const EMAIL_HASH_ROUNDS: u32 = 4000;

pub fn generate_salt() -> [u8; 32] {
    rand::thread_rng().gen::<[u8; 32]>()
}

pub fn hash_email(email: &str, salt: &[u8]) -> [u8; 32] {
    hash_pbkdf2(email, salt, EMAIL_HASH_ROUNDS)
}

fn hash_pbkdf2(val: &str, salt: &[u8], rounds: u32) -> [u8; 32] {
    let mut out = [0u8; 32];
    pbkdf2::pbkdf2_hmac::<sha2::Sha256>(val.as_bytes(), salt, rounds, &mut out);
    out
}
