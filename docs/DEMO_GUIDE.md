# SafeRoot Policy — Panduan Demo Video

Semua yang ada di dokumen ini sudah **live dan terverifikasi on-chain di testnet**.
Tidak ada mock, tidak ada data palsu.

---

## 1. Link & alamat penting

### Aplikasi live
| Layanan | URL |
|---|---|
| Frontend (yang direkam) | https://frontend-production-78b3.up.railway.app |
| Backend API | https://backend-production-1ff6f.up.railway.app |

### Smart contract (sudah ter-deploy)
| Kontrak | Chain | Alamat |
|---|---|---|
| `PolicyRegistry` | Ethereum Sepolia | `0xEE1920869bfCB8b24C1b5AAE45927E7ad12f07F0` |
| Authority Safe (2-of-3) | Ethereum Sepolia | `0xf4b6a941B0bB4699cba45970cBf7c476ccE49dDd` |
| `SafeRootPolicyExecutor` | Creditcoin CC3 | `0x57dE3c48b747A812fD643900568EA9FbCE6dF7cB` |
| `AttestcoinVerifierAdapter` | Creditcoin CC3 | `0x8964F00624b3aAF3f74d51db2016571dC398374d` |
| `MockUSDC` | Creditcoin CC3 | `0x3773a72021e0f923f58cA02643f0D22936a30303` |
| `LendingPoolMock` | Creditcoin CC3 | `0x80298359FAd5b1ee10f2fd60422E53F55e2e8D45` |

### Explorer
- Sepolia: https://sepolia.etherscan.io
- Creditcoin CC3: https://creditcoin-testnet.blockscout.com

---

## 2. Data demo yang sudah siap

**Policy: "Q4 Contributor Grant — Production Demo"** — status **`Completed`**

Link langsung ke halaman detailnya:
```
https://frontend-production-78b3.up.railway.app/policies/0x46ed58b5e14e07ad6300248a68e9064db0cd67efe971351b7cb2c6194f1e6a0b
```

Bukti transaksi nyata di setiap tahap:

| Tahap | Chain | Tx Hash |
|---|---|---|
| Safe tx dieksekusi (registerPolicy) | Sepolia | `0xbb32e12051c24204d7d87d4d8b174ab6eab36955e222132b42207d69fc09695b` |
| Attestcoin proof | — | `usc:1:11625827:0xbb32e120...` (block 11625827) |
| `activatePolicy` (verifikasi proof) | CC3 | `0xa81e808705a4ea324bdf2b31580f470fcec3bdcfb4e28e2a3de28d0a3218d8db` |
| `executeAction` (pembayaran) | CC3 | `0x9a91f2ec455b87e14ba61f349b832ac2a231cebd2595ce8a481f0767c7c96083` |

**Hasil akhir:** 2.500 MockUSDC benar-benar terkirim ke `0x415289a6B8Ba252f6B9124fad7eE01AaA90cc769`.

---

## 3. Skrip rekaman (target 5-7 menit)

### Bagian 1 — Masalah yang diselesaikan (30-45 detik)
Yang perlu dijelaskan:

> "Safe multisig adalah standar de-facto untuk treasury DAO — tapi otoritasnya berhenti di
> chain tempat Safe itu berada. Kalau tim ingin mengeksekusi sesuatu di chain lain, biasanya
> jawabannya adalah bridge yang dipercaya, atau signer terpisah di chain tujuan. Dua-duanya
> menambah permukaan kepercayaan baru.
>
> SafeRoot menghapus itu: satu approval di Safe Ethereum Anda, diverifikasi secara trustless
> lewat oracle Attestcoin milik Creditcoin, lalu dieksekusi dengan batasan ketat di Creditcoin."

Poin kunci: **kami tidak membuat sistem signer baru.** Safe tetap jadi sumber otoritas.

### Bagian 2 — Tunjukkan hasil nyata (1,5-2 menit) ⭐ bagian terpenting
1. Buka halaman `/policies` → tunjukkan kartu policy **"Q4 Contributor Grant — Production Demo"** berstatus `Completed`
2. Klik masuk ke detail policy
3. Scroll ke **timeline aktivitas** dan bacakan alurnya:
   - `PolicyDrafted` — policy dibuat
   - `SubmittedToSafe` — diajukan ke Safe
   - `SafeSignatureAdded` ×2 — dua owner menandatangani (2 dari 3)
   - `SafeThresholdReached` — threshold tercapai
   - `SourceTransactionExecuted` — Safe tx dieksekusi di **Ethereum Sepolia**
   - `AttestcoinEvidenceAvailable` — Attestcoin sudah attest block sumbernya
   - `PolicyVerifiedOnCreditcoin` — proof diverifikasi on-chain di **Creditcoin CC3**
   - `ActionExecuted` — aksi dieksekusi persis seperti yang di-approve
4. **Klik tx hash-nya → buka di explorer** (Sepolia untuk Safe tx, Blockscout untuk CC3)

> Kalimat yang perlu diucapkan di sini:
> "Ini bukan simulasi. Ini transaksi nyata di dua chain berbeda, dihubungkan oleh proof
> kriptografis dari Attestcoin — bukan oleh bridge atau relayer yang harus dipercaya."

### Bagian 3 — Tunjukkan cara membuat policy (1-1,5 menit)
1. Klik **"Select Safe"** → masukkan `0xf4b6a941B0bB4699cba45970cBf7c476ccE49dDd`
2. Tunjukkan owners dan threshold **ter-load otomatis** dari Safe Transaction Service asli
3. Klik **"Create Policy"** → pilih template aksi (grant / risk-cap / pause) → isi parameter
4. Submit → policy baru muncul dengan status `Draft`

> Jelaskan: "Setiap policy punya batasan eksplisit — kontrak target, function selector,
> parameter persis, jendela waktu aktif, dan waktu kedaluwarsa. Semua ini dikunci ke dalam
> approval Safe-nya."

Tidak perlu menyelesaikan sampai eksekusi di video — cukup tunjukkan UX-nya, lalu kembali
ke policy yang sudah `Completed`.

> ⚠️ Penting: proses Attestcoin butuh **20-30 menit** untuk attest block sumber.
> Jangan menunggu di depan kamera. Itulah alasan kami menyiapkan policy `Completed` di awal.

### Bagian 4 — Tunjukkan keamanannya (1-1,5 menit) ⭐ pembeda utama
Buka halaman **`/protected`** dari policy, lalu gunakan panel tampered execution:

1. Coba submit `executeAction` dengan **parameter yang sengaja diubah** (misal ubah jumlah
   dari 2.500 jadi 25.000)
2. Tunjukkan transaksi **ditolak oleh kontrak** dengan alasan spesifik (`CalldataMismatch`)

> Kalimat kuncinya:
> "Yang ditolak di sini bukan UI — tapi smart contract-nya sendiri. Bahkan kalau penyerang
> punya proof yang valid dan memanggil kontrak langsung, dia tidak bisa mengubah satu byte
> pun dari apa yang sudah di-approve oleh Safe."

Kalau sempat, sebutkan bahwa ada **25 kasus adversarial** yang ditangani (spoofed emitter,
replay, expiry, reentrancy, guardian pause, dll) — semuanya ada di test suite.

### Bagian 5 — Guardian pause (opsional, 30 detik)
Tunjukkan tombol guardian pause → policy berubah jadi `Paused`, dan aksi yang belum
dieksekusi langsung terblokir.

> "Kalau ada yang salah, guardian bisa menghentikan eksekusi seketika — tanpa perlu
> mengumpulkan tanda tangan multisig lagi."

### Bagian 6 — Penutup (30 detik)
Rangkum tiga poin:
1. **Satu approval Safe** — tidak ada sistem signer baru yang harus dipercaya
2. **Verifikasi trustless** lewat Attestcoin/USC, bukan bridge
3. **Eksekusi terbatas** — kontrak menolak apa pun yang menyimpang dari yang di-approve

Sebutkan bahwa semuanya sudah live di testnet Creditcoin CC3 + Ethereum Sepolia,
kode ada di GitHub, dan aplikasinya bisa diakses publik.

---

## 4. Checklist sebelum menekan rekam

- [ ] Buka `https://frontend-production-78b3.up.railway.app/policies` — pastikan policy
      `Completed` tampil (bukan tulisan "Showing example data")
- [ ] Buka halaman detail policy — pastikan timeline lengkap tampil
- [ ] Buka tab kedua berisi Blockscout CC3 dan Etherscan Sepolia, siap untuk menunjukkan tx
- [ ] Pasang wallet extension (MetaMask/Rabby), tambahkan network **Creditcoin CC3**
      (chainId `102031`, RPC `https://rpc.cc3-testnet.creditcoin.network`)
- [ ] Zoom browser ke 110-125% supaya teks terbaca jelas di video
- [ ] Tutup tab/bookmark pribadi yang tidak perlu terlihat

---

## 5. Istilah yang perlu dijelaskan dengan benar

| Istilah | Cara menjelaskan singkat |
|---|---|
| **Attestcoin / USC** | Oracle terdesentralisasi milik Creditcoin. Attestor membangun konsensus atas riwayat Ethereum; prover menghasilkan proof bahwa suatu transaksi benar terjadi; kontrak di Creditcoin memverifikasinya lewat precompile `0xFD2` — tanpa perlu mempercayai pihak ketiga. |
| **Policy** | Sekumpulan aksi yang di-approve sekali oleh Safe, dengan batasan target, parameter, dan waktu yang eksplisit. |
| **Action** | Satu pemanggilan fungsi konkret (misal: bayar 2.500 USDC ke alamat X). |
| **Guardian** | Alamat terpisah dari Safe yang bisa menghentikan (pause) eksekusi dalam keadaan darurat. |
| **Executor** | Kontrak di Creditcoin yang menyimpan policy terverifikasi dan menegakkan batasannya saat eksekusi. |

---

## 6. Pertanyaan yang mungkin muncul (dan jawabannya)

**"Kenapa tidak pakai bridge saja?"**
Bridge menambah pihak yang harus dipercaya dan menjadi target serangan bernilai tinggi.
SafeRoot tidak memindahkan aset lintas chain — yang dipindahkan hanya **bukti bahwa sebuah
approval terjadi**, dan bukti itu diverifikasi secara kriptografis.

**"Siapa yang membayar gas eksekusi di Creditcoin?"**
Siapa pun. Kontrak menegakkan batasan tanpa peduli siapa pemanggilnya — jadi relayer
tidak perlu dipercaya sama sekali. Di demo ini kami memakai wallet deployer.

**"Apa yang terjadi kalau proof-nya dipalsukan?"**
Verifikasi dilakukan oleh precompile Native Query Verifier Creditcoin terhadap konsensus
attestor. Proof palsu akan gagal diverifikasi, dan kontrak menolak dengan error spesifik.

**"Apakah Safe-nya perlu dimodifikasi?"**
Tidak. SafeRoot memakai Safe standar tanpa module atau guard tambahan. Approval-nya cuma
transaksi Safe biasa yang memanggil `PolicyRegistry`.
