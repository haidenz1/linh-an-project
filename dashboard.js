// 1. Nhập các hàm cần thiết từ thư viện Firebase (phiên bản 10.13.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { 
    getFirestore, 
    collection, 
    getDocs, 
    doc, 
    setDoc, 
    getDoc,
    deleteDoc 
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// 2. Cấu hình Firebase của bạn
const firebaseConfig = {
    apiKey: "AIzaSyAFoOmGl4EzEzaVYYqf6v21N8ZByLWAM3c",
    authDomain: "linhanthanhlong.firebaseapp.com",
    projectId: "linhanthanhlong",
    storageBucket: "linhanthanhlong.firebasestorage.app",
    messagingSenderId: "258822651286",
    appId: "1:258822651286:web:8968e99f2bcacd1d96b1b7"
};

// 3. Khởi tạo Firebase và Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. Các logic xử lý giao diện
document.addEventListener('DOMContentLoaded', () => {
    const pageListContainer = document.getElementById('page-list-container');
    const createNewBtn = document.getElementById('create-new-btn');

    // --- HÀM TẢI DANH SÁCH TỪ FIREBASE ---
    async function loadPages() {
        try {
            pageListContainer.innerHTML = '<div id="loading-state">Đang tải dữ liệu từ máy chủ...</div>';
            
            // Truy cập vào bảng (collection) "pages"
            const querySnapshot = await getDocs(collection(db, "pages"));
            const pages = [];
            
            // Duyệt qua từng tài liệu thu được
            querySnapshot.forEach((docSnap) => {
                pages.push(docSnap.id); // Lấy tên định danh (slug) chính là ID của tài liệu
            });

            renderPageList(pages);

        } catch (error) {
            pageListContainer.innerHTML = `<div id="error-state">Lỗi khi kết nối máy chủ: ${error.message}</div>`;
        }
    }

    // --- HÀM HIỂN THỊ GIAO DIỆN ---
    function renderPageList(pages) {
        pageListContainer.innerHTML = ''; 
        if (pages.length === 0) {
            pageListContainer.innerHTML = '<div id="loading-state">Chưa có trang nào được tạo.</div>';
            return;
        }

        pages.forEach(slug => {
            const pageItem = document.createElement('div');
            pageItem.className = 'page-item';
            pageItem.innerHTML = `
                <span class="page-item-name">${slug}</span>
                <div class="page-item-actions">
                    <a href="../index.html?page=${slug}" target="_blank">Xem trang</a>
                    <a href="../index.html?edit=${slug}" target="_blank">Chỉnh sửa</a>
                    <button class="delete-btn" data-slug="${slug}">Xóa</button>
                </div>
            `;
            pageListContainer.appendChild(pageItem);
        });
    }

    // --- XỬ LÝ NÚT TẠO MỚI ---
    createNewBtn.addEventListener('click', async () => {
        const newSlug = prompt("Nhập tên định danh cho trang mới (ví dụ: 'khachhang-a-001').\nChỉ dùng chữ thường, số và dấu gạch ngang.");
        const trimmedSlug = newSlug ? newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : null;

        if (trimmedSlug) {
            try {
                // Kiểm tra xem trang này đã tồn tại trên database chưa
                const docRef = doc(db, "pages", trimmedSlug);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    alert('Lỗi: Tên định danh này đã tồn tại trên máy chủ!');
                    return;
                }

                // Lưu trang mới lên Firebase
                await setDoc(docRef, {
                    createdAt: new Date().toISOString(), // Lưu lại thời gian tạo
                    slug: trimmedSlug
                });

                // Chuyển hướng và tải lại danh sách
                window.open(`../index.html?edit=${trimmedSlug}`, '_blank');
                loadPages();

            } catch (error) {
                alert(`Lỗi khi tạo trang: ${error.message}`);
            }
        }
    });

    // --- XỬ LÝ NÚT XÓA ---
    pageListContainer.addEventListener('click', async (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const slug = event.target.dataset.slug;
            if (confirm(`Bạn có chắc chắn muốn xóa trang "${slug}" không? Hành động này không thể hoàn tác.`)) {
                try {
                    // Gọi lệnh xóa dữ liệu trên Firebase
                    await deleteDoc(doc(db, "pages", slug));
                    
                    alert('Đã xóa dữ liệu trên máy chủ thành công!');
                    loadPages(); // Tải lại danh sách

                } catch (error) {
                    alert(`Lỗi khi xóa: ${error.message}`);
                }
            }
        }
    });

    // Bắt đầu tải danh sách khi mở web
    loadPages();
});