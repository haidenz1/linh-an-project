// File: admin.js

console.log("Chế độ Admin đã được kích hoạt (Lưu vào localStorage).");

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

    // --- KÍCH HOẠT CHẾ ĐỘ CHỈNH SỬA ---
    const editableElements = document.querySelectorAll('[data-editable]');
    editableElements.forEach(el => {
        el.contentEditable = true;
        el.style.outline = '2px dashed rgba(232, 200, 117, 0.7)';
        el.style.cursor = 'text';
        el.style.transition = 'outline 0.2s ease';
        
        el.addEventListener('focus', () => {
            el.style.outline = '2px solid rgba(232, 200, 117, 1)';
        });
        el.addEventListener('blur', () => {
             el.style.outline = '2px dashed rgba(232, 200, 117, 0.7)';
        });
    });

    // --- KÍCH HOẠT CHẾ ĐỘ CHỈNH SỬA HÌNH ẢNH ---
    const editableImageContainers = document.querySelectorAll('[data-editable-img]');
    editableImageContainers.forEach(container => {
        // Thêm giao diện để người dùng biết đây là vùng có thể sửa
        container.style.position = 'relative';
        container.style.cursor = 'pointer';
        
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); color: white;
            display: flex; justify-content: center; align-items: center;
            font-family: Arial, sans-serif; font-size: 16px; font-weight: bold;
            opacity: 0; transition: opacity 0.3s ease;
            pointer-events: none; /* Cho phép click xuyên qua overlay */
        `;
        overlay.textContent = 'Đổi ảnh';
        container.appendChild(overlay);

        container.addEventListener('mouseenter', () => { overlay.style.opacity = '1'; });
        container.addEventListener('mouseleave', () => { overlay.style.opacity = '0'; });

        // Khi click vào vùng chứa ảnh
        container.addEventListener('click', () => {
            const imgElement = container.querySelector('img');
            if (!imgElement) return;

            // Yêu cầu người dùng nhập URL mới
            const newUrl = prompt("Nhập URL hình ảnh mới:", imgElement.src);

            // Nếu người dùng nhập URL và không hủy, cập nhật ảnh
            if (newUrl && newUrl.trim() !== '') {
                imgElement.src = newUrl.trim();
            }
        });
    });

    // --- XỬ LÝ LƯU THAY ĐỔI ---
    const saveButton = document.getElementById('save-changes-btn');
    const saveStatus = document.getElementById('save-status');

    saveButton.addEventListener('click', async () => {
        const dataToSave = {};

        // 1. Thu thập dữ liệu văn bản
        editableElements.forEach(el => {
            const key = el.dataset.editable;
            dataToSave[key] = el.innerHTML; 
        });

        // 2. Thu thập URL hình ảnh
        editableImageContainers.forEach(container => {
            const key = container.dataset.editableImg;
            const img = container.querySelector('img');
            if (img) {
                dataToSave[key] = img.src;
            }
        });

        console.log("Dữ liệu sẽ được gửi lên API:", dataToSave);
        saveStatus.textContent = 'Đang lưu...';
        saveStatus.style.display = 'inline';
        saveButton.disabled = true;

        try {
            // 3. Lấy slug từ URL
            const slug = new URLSearchParams(window.location.search).get('edit');
            if (!slug) {
                throw new Error("Không tìm thấy slug trong URL để lưu.");
            }
            
            // 4. Lưu dữ liệu vào localStorage của trình duyệt
            localStorage.setItem(`linhan_page_${slug}`, JSON.stringify(dataToSave));

            // 5. Cập nhật danh sách index nếu slug này là mới
            const PAGES_INDEX_KEY = 'linhan_pages_index';
            const pagesJson = localStorage.getItem(PAGES_INDEX_KEY);
            let pages = pagesJson ? JSON.parse(pagesJson) : [];
            if (!pages.includes(slug)) {
                pages.push(slug);
                localStorage.setItem(PAGES_INDEX_KEY, JSON.stringify(pages));
            }

            saveStatus.textContent = 'Lưu thành công!';

        } catch (error) {
            console.error('Lỗi khi lưu:', error);
            saveStatus.textContent = `Lỗi: ${error.message}`;
        } finally {
            // Ẩn thông báo sau 3 giây
            setTimeout(() => {
                saveStatus.style.display = 'none';
                saveButton.disabled = false;
            }, 3000);
        }
    });
