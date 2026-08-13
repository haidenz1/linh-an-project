/**
 * @file script.js
 * @description Quản lý toàn bộ logic tương tác cho trang web "Linh Ấn".
 * @version 1.1.0
 * @date 2026-08-12
 *
 * MỤC LỤC:
 * 1. KHAI BÁO BIẾN & DOM ELEMENTS
 * 2. LOGIC BẢNG THÔNG TIN (INFO PANEL)
 * 3. LOGIC HIỆU ỨNG CHUYỂN TRANG (HOA SEN)
 * 4. LOGIC ANIMATION 3D THEO VỊ TRÍ CUỘN
 *    - updateModelMorph(): Hàm chính tính toán vị trí, kích thước model.
 *    - onScroll(): Tối ưu hiệu năng cuộn bằng requestAnimationFrame.
 * 5. LOGIC TRANG 5 (LÁ BÀI 3D)
 *    - IntersectionObserver: Kích hoạt animation khi cuộn vào/ra khỏi trang 5.
 */

document.addEventListener('DOMContentLoaded', async () => { // Chuyển thành hàm async
    
    // ==========================================
    // 0. TẢI DỮ LIỆU ĐỘNG TỪ LOCALSTORAGE VÀ KÍCH HOẠT CHẾ ĐỘ ADMIN (NẾU CÓ)
    // ==========================================
    async function loadContent() {
        try {
            const params = new URLSearchParams(window.location.search);
            const pageSlug = params.get('page');
            const editSlug = params.get('edit');
            const slug = pageSlug || editSlug;
            
            // Nếu đang ở chế độ chỉnh sửa, tự động tải script admin.js
            if (editSlug) {
                console.log(`Kích hoạt chế độ chỉnh sửa cho: ${editSlug}`);
                const adminScript = document.createElement('script');
                adminScript.src = 'admin.js';
                document.body.appendChild(adminScript);
            }

            // Nếu không có slug nào, đây là trang chủ bình thường, không cần tải dữ liệu
            if (!slug) {
                console.log('Không có slug, bỏ qua việc tải nội dung động.');
                return;
            }

            // Lấy dữ liệu từ localStorage
            const jsonData = localStorage.getItem(`linhan_page_${slug}`);

            // Nếu không có dữ liệu (trang mới hoặc slug sai), không làm gì cả
            if (!jsonData) {
                if (pageSlug) { // Chỉ báo lỗi nếu đang xem trang công khai mà không có dữ liệu
                     console.error(`Không tìm thấy dữ liệu cho trang '${slug}' trong localStorage.`);
                } else {
                    console.log(`Bắt đầu chỉnh sửa trang mới: '${slug}'.`);
                }
                return;
            }
            const data = JSON.parse(jsonData);

            // Điền nội dung văn bản
            for (const key in data) {
                const elements = document.querySelectorAll(`[data-editable="${key}"]`);
                elements.forEach(el => {
                    el.innerHTML = data[key];
                });
            }

            // Điền URL hình ảnh
            document.querySelectorAll('[data-editable-img]').forEach(container => {
                const key = container.dataset.editableImg;
                if (data[key]) {
                    const img = container.querySelector('img');
                    if (img) img.src = data[key];
                }
            });

            console.log(`Nội dung cho "${slug}" đã được tải thành công.`);
        } catch (error) {
            console.error('Lỗi khi tải nội dung động:', error);
        }
    }

    await loadContent(); // Chờ nội dung tải xong rồi mới chạy các script khác

    // ==========================================
    // 1. KHAI BÁO BIẾN & LẤY DOM ELEMENTS
    // ==========================================
    // Sử dụng const để đảm bảo các biến không bị gán lại giá trị.
    // Lấy tất cả các element cần thiết ngay từ đầu để tối ưu hiệu năng.
    const btnKhaiAn = document.getElementById('btn-khai-an');
    const lotusOverlay = document.getElementById('lotus-overlay');
    const page2 = document.getElementById('page-2');
    const page3 = document.getElementById('page-3');
    const page5 = document.getElementById('page-5');
    const scrollContainer = document.getElementById('scroll-container'); // Container chính cho việc cuộn trang
    const btnInfoPanel = document.getElementById('btn-info-panel');
    const infoPanel = document.getElementById('info-panel');
    const modelContainer = document.getElementById('global-model-container'); // Container chứa model 3D toàn cục
    const cardScene = document.getElementById('card-scene');
    const theCard = document.getElementById('the-card');

    // ==========================================
    // 2. LOGIC BẢNG THÔNG TIN (INFO PANEL)
    // ==========================================
    btnInfoPanel.addEventListener('click', () => {
        // Bật/tắt bảng thông tin khi click vào nút
        infoPanel.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
        // Tự động đóng bảng thông tin nếu click ra ngoài khu vực của nó
        if (!btnInfoPanel.contains(event.target) && !infoPanel.contains(event.target)) {
            infoPanel.classList.remove('show');
        }
    });

    // ==========================================
    // 3. LOGIC HIỆU ỨNG CHUYỂN TRANG (HOA SEN)
    // ==========================================
    btnKhaiAn.addEventListener('click', () => {
        // Bước 1: Hiện overlay hoa sen
        lotusOverlay.classList.remove('hidden');
        // Dòng "thần thánh": Buộc trình duyệt phải "reflow" (tính toán lại layout).
        // Nếu không có dòng này, trình duyệt sẽ gộp việc remove 'hidden' và add 'active'
        // vào cùng một frame, khiến animation không chạy.
        void lotusOverlay.offsetWidth; 
        lotusOverlay.classList.add('active');

        // Bước 2: Sau 700ms, bắt đầu cuộn mượt đến trang 2
        setTimeout(() => {
            page2.scrollIntoView({ behavior: 'smooth' });
        }, 700);

        // Bước 3: Sau 1.5s (khi animation hoa sen gần kết thúc), ẩn overlay đi
        setTimeout(() => {
            lotusOverlay.classList.remove('active');
            lotusOverlay.classList.add('hidden');
        }, 1500);
    });

    // ==========================================
    // 4. LOGIC ANIMATION 3D THEO VỊ TRÍ CUỘN
    // ==========================================
    
    /**
     * Hàm chính, tính toán và cập nhật vị trí, kích thước, độ trong suốt của model 3D
     * dựa vào giá trị scrollTop của container chính.
     */
    function updateModelMorph() {
        // Lấy các giá trị cần thiết cho việc tính toán
        const scrollTop = scrollContainer.scrollTop; // Vị trí cuộn của container chính
        const page3ScrollTop = page3.scrollTop;      // Vị trí cuộn của nội dung BÊN TRONG trang 3
        const vh = window.innerHeight;               // 1% chiều cao màn hình
        const vw = window.innerWidth;                // 1% chiều rộng màn hình
        
        // Tính toán vị trí cạnh phải của content để neo model 3D vào đó ở trang 3
        const contentWidth = Math.min(vw * 0.9, 400);
        const rightEdge = (vw / 2) + (contentWidth / 2);

        // --- GIAI ĐOẠN 1: Đang ở trang 1, chuẩn bị cuộn sang trang 2 ---
        if (scrollTop < vh) {
            // `progress` đi từ 0 (đầu trang 1) đến 1 (cuối trang 1 / đầu trang 2)
            const progress = scrollTop / vh; 
            
            // Model mờ dần hiện ra (0 -> 1)
            modelContainer.style.opacity = progress; 
            // Giữ cố định ở giữa màn hình
            modelContainer.style.top = '55%';
            modelContainer.style.left = '50%';
            modelContainer.style.width = '100vw';
            modelContainer.style.height = '450px';
            // Phóng to từ 0.5 lên 1.0
            modelContainer.style.transform = `translate(-50%, -50%) scale(${0.5 + (0.5 * progress)})`;
        
        // --- GIAI ĐOẠN 2: Đang cuộn từ trang 2 sang trang 3 ---
        } else if (scrollTop >= vh && scrollTop < vh * 2) {
            // `progress` đi từ 0 (đầu trang 2) đến 1 (cuối trang 2 / đầu trang 3)
            const progress = (scrollTop - vh) / vh; 
            
            // Thu nhỏ kích thước model từ to (trang 2) về nhỏ (trang 3)
            const currentWidth = vw - ((vw - 160) * progress); 
            const currentHeight = 450 - ((450 - 180) * progress); 
            
            // Di chuyển theo chiều ngang: từ giữa màn hình (50% vw) sang cạnh phải
            const startLeft = vw / 2;
            const targetLeft = rightEdge - (160 / 2); 
            const currentLeft = startLeft + ((targetLeft - startLeft) * progress);
            
            // Di chuyển theo chiều dọc: từ giữa (55% vh) bay lên trên (22% vh)
            const startTopPx = 0.55 * vh;
            const targetTopPx = 0.22 * vh; 
            
            // Tính toán vị trí top, trừ đi độ cuộn của trang 3 để model "bám" vào nội dung
            // khi người dùng bắt đầu cuộn nội dung ở trang 3.
            const currentTopPx = startTopPx + ((targetTopPx - startTopPx) * progress) - (page3ScrollTop * progress);
            
            modelContainer.style.opacity = 1;
            modelContainer.style.top = `${currentTopPx}px`; 
            modelContainer.style.left = `${currentLeft}px`;
            modelContainer.style.width = `${currentWidth}px`;
            modelContainer.style.height = `${currentHeight}px`;
            modelContainer.style.transform = `translate(-50%, -50%) scale(1)`;

        // --- GIAI ĐOẠN 3: Đang ở trang 3 và cuộn sang trang 4 ---
        } else if (scrollTop >= vh * 2 && scrollTop < vh * 3) {
            // `progress` đi từ 0 (đầu trang 3) đến 1 (cuối trang 3 / đầu trang 4)
            const progress = (scrollTop - (vh * 2)) / vh; 
            
            // Vị trí cố định trên cùng nếu không có cuộn nội bộ
            const fixedTopPx = 0.22 * vh; 
            
            // Logic "dính" và "bay đi":
            // 1. `fixedTopPx - page3ScrollTop`: Giữ cho model bám vào góc trên khi người dùng cuộn nội dung trang 3.
            // 2. `- (progress * vh)`: Khi người dùng cuộn từ trang 3 sang 4, model sẽ bay vút lên trên và biến mất.
            const currentTopPx = fixedTopPx - page3ScrollTop - (progress * vh);
            
            // Model mờ dần khi bay đi (1 -> 0)
            modelContainer.style.opacity = 1 - progress; 
            modelContainer.style.top = `${currentTopPx}px`; 
            // Giữ nguyên vị trí ngang và kích thước
            modelContainer.style.left = `${rightEdge - (160 / 2)}px`;
            modelContainer.style.width = '160px';
            modelContainer.style.height = '180px';
            modelContainer.style.transform = `translate(-50%, -50%) scale(1)`;

        // --- GIAI ĐOẠN 4: Đã qua khỏi trang 3, ẩn hoàn toàn model ---
        } else {
            modelContainer.style.opacity = 0;
            modelContainer.style.top = '-100vh'; // Đẩy hẳn ra ngoài màn hình
        }
    }

    // Tối ưu hiệu năng cuộn trang bằng requestAnimationFrame để tránh layout thrashing.
    let isTicking = false;
    const onScroll = () => {
        if (!isTicking) {
            window.requestAnimationFrame(() => {
                updateModelMorph();
                isTicking = false; // Cho phép nhận yêu cầu mới ở frame tiếp theo
            });
            isTicking = true; // Đánh dấu là đang chờ xử lý, không nhận thêm yêu cầu
        }
    };

    // Gắn listener vào cả container chính và nội dung trang 3
    scrollContainer.addEventListener('scroll', onScroll);
    page3.addEventListener('scroll', onScroll);
    window.addEventListener('resize', updateModelMorph);
    
    // Chạy lần đầu khi tải trang để đặt model vào đúng vị trí ban đầu
    updateModelMorph();

    // ==========================================
    // 5. LOGIC TRANG 5 (LÁ BÀI 3D)
    // ==========================================
    if (theCard) {
        theCard.addEventListener('click', () => {
            // Chỉ cho phép lật bài khi animation bay vào đã hoàn tất (có class 'ready')
            if (cardScene.classList.contains('ready')) {
                theCard.classList.toggle('flipped');
            }
        });
    }

    if (page5 && cardScene) {
        let entryTimeout; // Lưu trữ ID của setTimeout để có thể hủy khi cần.

        // Sử dụng IntersectionObserver để phát hiện khi trang 5 đi vào viewport
        const p5Observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    // Khi trang 5 hiện ra, bắt đầu animation bay vào của lá bài
                    cardScene.classList.add('show');
                    
                    // Sau khi animation 'show' kết thúc (2.5s), chuyển lá bài sang
                    // trạng thái 'ready' để có thể tương tác (lật bài, hiện nút).
                    entryTimeout = setTimeout(() => {
                        // Xóa class 'show' (chỉ dùng để kích hoạt animation)
                        cardScene.classList.remove('show');
                        // Thêm class 'ready' để cho phép lật và hiện nút "Gieo Duyên"
                        cardScene.classList.add('ready');
                    }, 2500); 

                } else {
                    // Khi người dùng cuộn ra khỏi trang 5:
                    // Hủy bộ đếm thời gian (nếu có) và reset tất cả các class về
                    // trạng thái ban đầu để animation có thể chạy lại vào lần sau.
                    clearTimeout(entryTimeout);
                    cardScene.classList.remove('show', 'ready');
                    theCard.classList.remove('flipped');
                }
            });
        }, { threshold: 0.5 }); // Kích hoạt khi trang 5 lọt vào 50% màn hình

        p5Observer.observe(page5);
    }
});