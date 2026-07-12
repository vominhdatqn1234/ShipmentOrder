# Migrate Firebase → Supabase

## Các bước thực hiện (theo thứ tự)

### 1. Tạo bảng trên Supabase
Mở [Supabase Dashboard](https://supabase.com/dashboard/project/czypkctnlwyormkwjwfl) → **SQL Editor** → dán toàn bộ nội dung `supabase/schema.sql` → **Run**.

Tạo 16 bảng (mỗi collection Firestore = 1 bảng dạng `id text + data jsonb`) và bucket storage `uploads` (public).

### 2. Copy data từ Firestore sang Supabase
```bash
node scripts/migrate-firestore-to-supabase.mjs
```
Yêu cầu Node 18+. Script đọc từng collection qua Firestore REST API và upsert vào Supabase (chạy lại nhiều lần được, không tạo trùng).

Nếu bảng bật RLS hoặc anon key không ghi được, chạy với service role key (Dashboard → Settings → API):
```bash
SUPABASE_SERVICE_ROLE_KEY=eyJ... node scripts/migrate-firestore-to-supabase.mjs
```

### 3. Chạy app
```bash
npm start
```
Keys đã nằm trong `.env`. App giờ đọc/ghi hoàn toàn trên Supabase.

## Cách code được migrate

Toàn bộ code app (~85 files) giữ nguyên logic, chỉ đổi import sang compatibility layer có API giống hệt Firestore nhưng chạy trên Supabase REST (không cần thêm dependency):

| Trước | Sau | File |
|---|---|---|
| `firebase/firestore` | `lib/db` | collection, doc, query, where, orderBy, limit, getDocs, getDoc, addDoc, setDoc, updateDoc, deleteDoc |
| `firebase/storage` | `lib/supastorage` | ref, uploadBytesResumable, getDownloadURL (bucket `uploads`) |
| `@react-query-firebase/firestore` | `lib/queryHooks` | useFirestoreQuery, useFirestoreCollectionMutation |
| `lib/firebase` (export firestore, storage) | giữ nguyên đường dẫn, ruột đã là Supabase | |

`tsconfig.json` thêm `"baseUrl": "src"` để import `lib/db` từ mọi nơi.

## Lưu ý

- **Ảnh cũ**: các URL `firebasestorage.googleapis.com` đã lưu trong data vẫn hoạt động bình thường. Ảnh upload mới sẽ vào Supabase Storage. Muốn chuyển cả file cũ sang thì cần thêm bước tải về/đăng lại (chưa làm trong đợt này).
- **Bảo mật**: các bảng đang tắt RLS để anon key đọc/ghi được (tương đương Firestore rules mở hiện tại). Nên chuyển sang Supabase Auth + bật RLS sau.
- **So sánh `<`, `>=` trên jsonb** là so sánh text. Các field đang dùng (`created` dạng ISO string) so sánh đúng; nếu sau này lọc range trên field số, cần đổi sang cột riêng.
- Có thể gỡ dependency `firebase`, `firebase-admin`, `@react-query-firebase/firestore` khỏi `package.json` khi mọi thứ chạy ổn.
