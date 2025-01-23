use rand::Rng;

pub const MIN_PASSWORD_LENGTH: usize = 4;

pub const PBKDF2_ROUNDS: u32 = 5000;

pub fn generate_salt() -> [u8; 32] {
    rand::thread_rng().gen::<[u8; 32]>()
}

pub fn hash_password(password: &str, salt: &[u8]) -> [u8; 32] {
    let mut out = [0u8; 32];
    pbkdf2::pbkdf2_hmac::<sha2::Sha256>(password.as_bytes(), salt, PBKDF2_ROUNDS, &mut out);
    out
}
