import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-firestore.js";

// Cấu hình Firebase
const firebaseConfig = {
    apiKey: "AIzaSyAFoOmGl4EzEzaVYYqf6v21N8ZByLWAM3c",
    authDomain: "linhanthanhlong.firebaseapp.com",
    projectId: "linhanthanhlong",
    storageBucket: "linhanthanhlong.firebasestorage.app",
    messagingSenderId: "258822651286",
    appId: "1:258822651286:web:8968e99f2bcacd1d96b1b7"
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

console.log("Chế độ Admin đã được kích hoạt (Kết nối Firebase).");

// --- TẠO GIAO DIỆN CHO ADMIN ---
const adminUI = document.createElement('div');
adminUI.innerHTML = `
    <div id="admin-panel" style="position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); z-index: 10000; background: rgba(0,0,0,0.8); backdrop-filter: blur(10px); border-radius: 12px; box-shadow: 0 5px 25px rgba(0,0,0,0.5); border: 1px solid #444;">
        <button id="save-changes-btn" style="background: linear-gradient(to bottom, #E8C875, #B08935); color: #1A1105; border: none; padding: 12px 25px; font-family: 'UTM Alexander', serif; font-size: 16px; cursor: pointer; border-radius: 11px;">
            Lưu Thay Đổi
        </button>
        <span id="save-status" style="color: #E8C875; font-size: 14px; margin: 0 15px; display: none;"></span>
    </div>
`;
document.body.appendChild(adminUI);

// --- KÍCH HOẠT CHẾ ĐỘ CHỈNH SỬA VĂN BẢN ---
const editableElements = document.querySelectorAll('[data-editable]');
editableElements.forEach(el => {
    el.contentEditable = true;
    el.style.outline = '2px dashed rgba(232, 200, 117, 0.7)';
    el.style.cursor = 'text';
    el.style.transition = 'outline 0.2s ease';
    
    el.addEventListener('focus', () => { el.style.outline = '2px solid rgba(232, 200, 117, 1)'; });
    el.addEventListener('blur', () => { el.style.outline = '2px dashed rgba(232, 200, 117, 0.7)'; });
});

// --- KÍCH HOẠT CHẾ ĐỘ CHỈNH SỬA HÌNH ẢNH ---
const editableImageContainers = document.querySelectorAll('[data-editable-img]');
editableImageContainers.forEach(container => {
    container.style.position = 'relative';
    container.style.cursor = 'pointer';
    
    const overlay = document.createElement('div');
    overlay.style.cssText = `
        position: absolute; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.5); color: white;
        display: flex; justify-content: center; align-items: center;
        font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;
        opacity: 0; transition: opacity 0.3s ease;
        pointer-events: none;
    `;
    overlay.textContent = 'Đổi ảnh';
    container.appendChild(overlay);

    container.addEventListener('mouseenter', () => { overlay.style.opacity = '1'; });
    container.addEventListener('mouseleave', () => { overlay.style.opacity = '0'; });

    container.addEventListener('click', () => {
        const imgElement = container.querySelector('img');
        if (!imgElement) return;
        const newUrl = prompt("Nhập URL hình ảnh mới:", imgElement.src);
        if (newUrl && newUrl.trim() !== '') {
            imgElement.src = newUrl.trim();
        }
    });
});

// --- XỬ LÝ LƯU THAY ĐỔI LÊN FIREBASE ---
const saveButton = document.getElementById('save-changes-btn');
const saveStatus = document.getElementById('save-status');

saveButton.addEventListener('click', async () => {
    const dataToSave = {};

    editableElements.forEach(el => { dataToSave[el.dataset.editable] = el.innerHTML; });
    editableImageContainers.forEach(container => {
        const img = container.querySelector('img');
        if (img) dataToSave[container.dataset.editableImg] = img.src;
    });

    saveStatus.textContent = 'Đang lưu lên máy chủ...';
    saveStatus.style.display = 'inline';
    saveButton.disabled = true;

    try {
        const slug = new URLSearchParams(window.location.search).get('edit');
        if (!slug) throw new Error("Không tìm thấy mã trang trong URL.");
        
        // Lưu dữ liệu vào trường 'content' của document (dùng merge để không đè mất ngày tạo gốc)
        await setDoc(doc(db, "pages", slug), {
            content: dataToSave,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        saveStatus.textContent = 'Lưu thành công!';
    } catch (error) {
        console.error('Lỗi khi lưu:', error);
        saveStatus.textContent = `Lỗi: ${error.message}`;
    } finally {
        setTimeout(() => {
            saveStatus.style.display = 'none';
            saveButton.disabled = false;
        }, 3000);
    }
});