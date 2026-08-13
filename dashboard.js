document.addEventListener('DOMContentLoaded', () => {
    const pageListContainer = document.getElementById('page-list-container');
    const createNewBtn = document.getElementById('create-new-btn');
    const PAGES_INDEX_KEY = 'linhan_pages_index';

    function getPages() {
        const pagesJson = localStorage.getItem(PAGES_INDEX_KEY);
        return pagesJson ? JSON.parse(pagesJson) : [];
    }

    function loadPages() {
        try {
            // Lấy danh sách các trang từ localStorage của trình duyệt
            const pages = getPages();
            renderPageList(pages);

        } catch (error) {
            pageListContainer.innerHTML = `<div id="error-state">Lỗi khi tải danh sách: ${error.message}</div>`;
        }
    }

    function renderPageList(pages) {
        pageListContainer.innerHTML = ''; // Xóa trạng thái "Đang tải"
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

    // Xử lý nút "Tạo mới"
    createNewBtn.addEventListener('click', () => {
        const newSlug = prompt("Nhập tên định danh cho trang mới (ví dụ: 'khachhang-a-001').\nChỉ dùng chữ thường, số và dấu gạch ngang.");
        // Chuẩn hóa slug: chữ thường, không dấu, không ký tự đặc biệt
        const trimmedSlug = newSlug ? newSlug.trim().toLowerCase().replace(/[^a-z0-9-]/g, '') : null;

        if (trimmedSlug) {
            const pages = getPages();
            if (pages.includes(trimmedSlug)) {
                alert('Lỗi: Tên định danh này đã tồn tại!');
                return;
            }
            pages.push(trimmedSlug);
            localStorage.setItem(PAGES_INDEX_KEY, JSON.stringify(pages));

            // Chuyển ngay đến trang chỉnh sửa cho slug mới
            window.open(`../index.html?edit=${trimmedSlug}`, '_blank');
            // Tải lại danh sách trên trang dashboard
            loadPages();
        }
    });

    // Xử lý nút "Xóa" (sử dụng event delegation)
    pageListContainer.addEventListener('click', (event) => {
        if (event.target.classList.contains('delete-btn')) {
            const slug = event.target.dataset.slug;
            if (confirm(`Bạn có chắc chắn muốn xóa trang "${slug}" không? Hành động này không thể hoàn tác.`)) {
                try {
                    let pages = getPages();
                    pages = pages.filter(p => p !== slug);
                    localStorage.setItem(PAGES_INDEX_KEY, JSON.stringify(pages));
                    localStorage.removeItem(`linhan_page_${slug}`);

                    alert('Đã xóa thành công!');
                    // Tải lại danh sách
                    loadPages();

                } catch (error) {
                    alert(`Lỗi: ${error.message}`);
                }
            }
        }
    });

    // Bắt đầu tải danh sách khi trang được mở
    loadPages();
});