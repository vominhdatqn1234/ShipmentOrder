# Deploy lên Vercel — 2 project riêng

Repo này chứa 2 app tách biệt, deploy thành **2 Vercel project riêng** từ cùng 1 repo:

| App | Root Directory (Vercel) | Config | Build từ |
|---|---|---|---|
| Client (seller) | `./` (gốc repo) | `vercel.json` | `node_modules` ở gốc |
| Admin portal | `admin-portal` | `admin-portal/vercel.json` | `admin-portal/node_modules` (độc lập) |

> Admin giờ có `admin-portal/package.json` **đầy đủ dependencies riêng**, build hoàn toàn độc lập — không còn phụ thuộc `node_modules` ở gốc.

## 1) Project CLIENT

- New Project → chọn repo → **Root Directory = `./`** (để nguyên gốc).
- Vercel tự đọc `vercel.json` ở gốc:
  - Install: `yarn install --frozen-lockfile`
  - Build: `yarn build` + copy `pdf.worker.min.js` vào `build/` (cần cho đọc PDF).
  - Output: `build`, SPA rewrite về `/index.html`.
- Deploy.

## 2) Project ADMIN

- New Project → chọn **cùng repo** → **Root Directory = `admin-portal`**.
- Vercel đọc `admin-portal/vercel.json`:
  - Install: `yarn install`
  - Build: `yarn build` (dùng `react-scripts` trong deps riêng của admin)
  - Output: `build`, SPA rewrite về `/index.html`.
- Deploy.

## Ghi chú

- **Node:** đã pin `20.x` qua `engines.node` trong cả 2 `package.json`. Nếu Vercel hỏi, chọn Node 20.
- **CI=false / NODE_OPTIONS:** đã set trong `vercel.json` để CRA không coi warning là lỗi và tránh out-of-memory.
- **Biến môi trường (tùy chọn):** app đã hardcode fallback Supabase nên chạy được ngay. Muốn tách môi trường thì set trong Vercel → Settings → Environment Variables:
  - `REACT_APP_SUPABASE_URL`, `REACT_APP_SUPABASE_ANON_KEY` (client).
- **Lần đầu build admin:** vì admin có deps riêng, `yarn install` sẽ tự tạo `admin-portal/yarn.lock`. Commit file lock đó để build sau nhanh và ổn định hơn (khi đó có thể đổi install thành `yarn install --frozen-lockfile`).
