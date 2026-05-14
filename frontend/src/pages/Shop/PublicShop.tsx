EPIC 1: DÒNG TIỀN GIAO DỊCH VÀ LƯU TRỮ (TRANSACTION & HOLDING)
[FIN-01] Tích hợp Cổng thanh toán (Payment Gateway Integration)

User Story: Là Khách hàng, tôi muốn có thể thanh toán qua nhiều phương thức (Visa/Mastercard, VNPay, MoMo, COD) để linh hoạt khi mua sắm.

Acceptance Criteria (AC):

Backend sinh mã giao dịch (TxnRef) độc nhất cho mỗi đơn hàng.

Webhook từ cổng thanh toán trả về HTTP 200 OK tự động cập nhật trạng thái đơn sang PAID.

Hệ thống có cơ chế xử lý bất đồng bộ (Async/Retry) để đối soát các giao dịch bị timeout hoặc pending từ cổng thanh toán.

[FIN-02] Cơ chế Tạm giữ & Giải tỏa (Escrow System & Release)

User Story: Là Sàn, tôi muốn tiền khách thanh toán được giữ trong ví trung gian (Escrow) và chỉ giải ngân cho Seller khi đơn hàng thành công và qua thời gian khiếu nại.

Acceptance Criteria (AC):

Hệ thống sử dụng biến escrowWindowDays từ Cấu hình Tài chính.

Có Cron Job chạy ngầm mỗi đêm: Quét các đơn COMPLETED đã quá số ngày Escrow để chuyển tiền từ "Ví tạm giữ" sang "Số dư khả dụng" của Seller.

[FIN-03] Trừ phí Thanh toán tự động (Payment Gateway Fee Deduction)

User Story: Là Sàn, tôi muốn tự động trừ chi phí xử lý giao dịch mà cổng thanh toán thu (VD: 2% của thẻ Visa) trực tiếp vào doanh thu của Seller.

Acceptance Criteria (AC):

Có bảng cấu hình % Phí thanh toán theo từng phương thức (MoMo 1.5%, Visa 2%, COD 0%).

Khi hạch toán (Escrow Release), hệ thống tạo 1 transaction trừ tiền phí này và hiển thị minh bạch trên sổ cái của Seller.

[FIN-04] Giải ngân Tự động/Thủ công (Auto/Manual Payout & Limit)

User Story: Là Seller, tôi muốn rút tiền từ Số dư về tài khoản ngân hàng một cách tự động hoặc chờ Admin duyệt.

Acceptance Criteria (AC):

Validate điều kiện: minWithdrawalAmount và maxDailyWithdrawalsPerShop.

Nếu lệnh rút < autoPayoutMaxLimit: Gọi API Vietcombank chuyển tiền tự động, đổi status sang COMPLETED.

Nếu lệnh rút > ngưỡng: Đổi status sang PROCESSING và yêu cầu Global Admin duyệt tay.

EPIC 2: ĐỐI SOÁT VÀ CẤN TRỪ (RECONCILIATION & ADJUSTMENT)
[FIN-05] Đối soát Phí Vận Chuyển (Shipping Fee Reconciliation)

User Story: Là Sàn, tôi muốn cấn trừ chênh lệch giữa Phí ship ước tính (thu của khách) và Phí ship thực tế (Hãng vận chuyển báo về) để phạt Seller nếu họ nhập sai cân nặng.

Acceptance Criteria (AC):

Backend có API nhận file đối soát (Excel/CSV) hoặc Webhook từ hãng vận chuyển (GHN/GHTK) chứa mã vận đơn và phí thực tế.

Tính toán: Chênh lệch = Phí thực tế - Phí đã thu.

Nếu Chênh lệch > 0: Tự động tạo một transaction - (âm) trừ thẳng vào ví doanh thu của Seller và gửi Notification.

[FIN-06] Phân bổ Trợ giá Voucher Sàn/Shop (Voucher Subsidy Settlement)

User Story: Là Kế toán Sàn, tôi muốn hệ thống phân tách rạch ròi chi phí Voucher do Sàn tài trợ và Voucher do Shop tự tạo để hạch toán không bị lỗ.

Acceptance Criteria (AC):

Đơn hàng (Order) lưu 2 field riêng biệt: platformDiscount và shopDiscount.

Tiền khách trả = Tổng tiền - platformDiscount - shopDiscount.

Khi hạch toán cho Seller: Doanh thu Seller nhận = Tổng tiền hàng - shopDiscount. (Sàn tự động dùng tiền quỹ bù vào phần platformDiscount).

[FIN-07] Hoàn tiền & Thu hồi Xu (Refund & Coin Clawback)

User Story: Là Sàn, khi có khiếu nại "Trả hàng/Hoàn tiền" thành công, tôi muốn hoàn tiền cho khách, đồng thời thu hồi lại Số dư của Seller và Xu (Coin) của khách.

Acceptance Criteria (AC):

Gọi API Refund của Cổng thanh toán để trả tiền về thẻ/ví của Buyer.

Ghi nhận Clawback: Tạo transaction trừ lại tiền trong Ví khả dụng của Seller.

Thu hồi Xu Cashback từ ví Xu của Buyer (nếu ví Xu hiện tại không đủ để thu hồi, cho phép ghi nhận số dư Xu bị âm).

[FIN-08] Quản lý Số dư Âm ví Seller (Negative Balance Management)

User Story: Là Sàn, tôi muốn hệ thống cho phép Ví của Seller bị âm (nếu bị phạt hoặc thu hồi mà không còn tiền) và tự động cấn trừ nợ khi họ có doanh thu mới.

Acceptance Criteria (AC):

Cho phép field balance trong Wallet Entity mang giá trị < 0.

Khi có đơn hàng mới được hạch toán (Escrow Release), hệ thống ưu tiên lấp đầy khoản âm trước, phần tiền dư còn lại mới được cộng vào Số dư khả dụng.

EPIC 3: MÔ HÌNH THU PHÍ & LỢI NHUẬN SÀN (MONETIZATION ENGINE)
[FIN-09] Thu phí Hoa hồng cố định & Phí rút tiền (Flat Commission & Fees)

User Story: Là Sàn, tôi muốn thu phần trăm hoa hồng và phí rút tiền cố định theo cấu hình.

Acceptance Criteria (AC):

Đã hoàn thành: Sử dụng commissionRate và flatWithdrawalFee trong PlatformConfig.

[FIN-10] Thu phí Hoa hồng theo Ngành hàng (Category-based Commission)

User Story: Là Sàn, tôi muốn thu phí hoa hồng khác nhau tùy theo Danh mục sản phẩm (VD: Đồ điện tử thu 2%, Mỹ phẩm thu 8%) để tối ưu lợi nhuận.

Acceptance Criteria (AC):

Bổ sung field commissionRate vào Entity Category.

Khi tính phí (ở OrderService), hệ thống ưu tiên lấy % của Category cấp cuối cùng. Nếu Category không set phí, fallback về commissionRate mặc định của Sàn.

[FIN-11] Gói Dịch vụ Trả phí cho Seller (Subscription / Service Packages)

User Story: Là Seller, tôi muốn mua gói "Freeship Extra" hoặc "Hoàn Xu Extra" để đẩy sản phẩm, và đồng ý bị sàn thu thêm % phí trên mỗi đơn.

Acceptance Criteria (AC):

Tạo bảng SellerSubscriptions quản lý các gói Shop đang kích hoạt.

Khi tính phí đơn hàng: Total Fee = Base Commission + Package Fee (VD: +4%).

UI Frontend hiển thị Badge (Huy hiệu Extra) cho các sản phẩm thuộc Shop này.

[FIN-12] Hệ thống Ví Quảng Cáo & Nạp tiền (Seller Ads Wallet & Top-up)

User Story: Là Seller, tôi muốn có một ví riêng để nạp tiền mặt vào và chạy quảng cáo (đấu thầu từ khóa) trên sàn.

Acceptance Criteria (AC):

Tạo Wallet Type mới là ADS_WALLET tách biệt với REVENUE_WALLET.

Cung cấp cổng Top-up (Nạp tiền Inbound) qua VNPay/Chuyển khoản để nạp vào ADS_WALLET.

Có Cron Job hoặc Event Listener trừ tiền trong ví quảng cáo dựa trên log lượt Click (CPC).

EPIC 4: CÔNG CỤ TÀI CHÍNH CHO SELLER (SELLER FINANCIAL TOOLS)
[FIN-13] Sổ cái Giao dịch / Sao kê (Seller Ledger / Transaction History)

User Story: Là Seller, tôi muốn xem chi tiết bảng sao kê ghi nhận biến động từng đồng ra/vào để kiểm soát dòng tiền và đối soát.

Acceptance Criteria (AC):

Tạo Entity WalletTransaction ghi chi tiết: ID, Thời gian, Loại giao dịch (Doanh thu bán/Trừ phí sàn/Trừ phí ship/Rút tiền), Số tiền thay đổi, Số dư cuối.

Giao diện Seller Center có bộ lọc theo Ngày/Tháng và nút "Export Excel".

[FIN-14] Xuất Hóa đơn Điện tử Tự động (Automated e-Invoicing)

User Story: Là Kế toán Sàn, tôi muốn hệ thống tự động xuất Hóa đơn GTGT (VAT) cho các khoản phí dịch vụ (Hoa hồng, Rút tiền) đã thu của Seller để hợp thức hóa chứng từ.

Acceptance Criteria (AC):

Batch job chạy ngày mùng 1 hàng tháng: Tổng hợp toàn bộ phí sàn đã thu của từng Seller trong tháng trước.

Gọi API đối tác xuất hóa đơn (như MISA/VNPT Invoice) để sinh e-Invoice và gửi link tải qua Email cho Seller.

[FIN-15] Khấu trừ và Kê khai Thuế TNCN (Tax Withholding & Reporting)

User Story: Là Sàn, tôi muốn tự động khấu trừ Thuế TNCN (1.5%) tại nguồn và xuất báo cáo kê khai cho Cơ quan Thuế.

Acceptance Criteria (AC):

Áp dụng taxWithholdingRate vào luồng hạch toán doanh thu.

Có màn hình Admin Report xuất dữ liệu thô (Raw Data) theo chuẩn Mẫu 01/CNKD của Tổng cục Thuế Việt Nam để Kế toán upload lên HTKK.

[FIN-16] Ứng vốn / Cấp tín dụng Seller (Seller Micro-lending)

User Story: Là Seller có doanh thu tốt, tôi muốn được Sàn cấp hạn mức ứng trước tiền để nhập hàng.

Acceptance Criteria (AC):

Tích hợp API của Ngân hàng/Tổ chức tín dụng để tính điểm tín dụng (Credit Scoring) dựa trên GMV (Tổng doanh thu) 6 tháng của Seller.

Tính năng tự động trích lập % doanh thu hàng ngày của Seller để trả nợ khoản vay ngân hàng.

EPIC 5: TÀI CHÍNH HỆ SINH THÁI (ECOSYSTEM & CORPORATE)
[FIN-17] Ví Tiếp thị Liên kết (Affiliate / KOC Wallet)

User Story: Là KOC/Tiktoker, tôi muốn nhận tiền hoa hồng khi có người mua hàng qua link Affiliate của tôi và rút tiền về thẻ.

Acceptance Criteria (AC):

Tracking Cookie/UTM trong URL khi User đặt hàng.

Đơn hàng COMPLETED sẽ chia % doanh thu (cấu hình trước) vào AFFILIATE_WALLET của KOC.

KOC có giao diện Rút tiền (áp dụng rule KYC y hệt Seller).

[FIN-18] Tín dụng Người mua / Trả góp (BNPL - Buy Now Pay Later)

User Story: Là Người mua, tôi muốn thanh toán bằng hạn mức trả sau (SPayLater) để chia nhỏ khoản thanh toán.

Acceptance Criteria (AC):

Tích hợp cổng thanh toán BNPL.

Sàn hạch toán 100% doanh thu một lần cho Seller. Sàn (hoặc đối tác ngân hàng) chịu trách nhiệm thu nợ trả góp hàng tháng từ người mua kèm phí chuyển đổi trả góp.

[FIN-19] Cảnh báo Gian lận & Rửa tiền (Anti-Fraud / AML Flags)

User Story: Là Admin Quản trị rủi ro, tôi muốn hệ thống tự động khóa các giao dịch/tài khoản có dấu hiệu đặt đơn ảo (Brushing) hoặc rửa tiền.

Acceptance Criteria (AC):

Rule Engine: Flag cảnh báo nếu 1 IP đặt > 50 đơn/ngày, hoặc 1 thẻ tín dụng thanh toán cho > 10 User khác nhau.

Action: Tự động đổi Account Status sang BANNED, đóng băng (Freeze) Ví tạm giữ, khóa tính năng tạo lệnh rút tiền.

[FIN-20] Dashboard Báo cáo Lãi/Lỗ Toàn sàn (Platform P&L Dashboard)

User Story: Là Giám đốc (Global Admin), tôi muốn xem báo cáo P&L (Profit & Loss) realtime để biết Sàn đang kinh doanh có lãi hay không.

Acceptance Criteria (AC):

Công thức Tổng Lãi (Revenue) = Tổng Hoa hồng thu được + Phí rút tiền + Chênh lệch phí ship dương.

Công thức Tổng Lỗ (Cost) = Tiền trợ giá Voucher Sàn (platformDiscount) + Chi phí hoàn xu.

Hiển thị biểu đồ Line Chart và Bar Chart.

EPIC 6: QUẢN TRỊ RỦI RO NGÁCH (RISK & EDGE-CASES)
[FIN-21] Phạt tiền vi phạm vận hành (Operational Fines / Penalty)

User Story: Là Admin, tôi muốn có công cụ trừ tiền phạt (Penalty) trực tiếp vào ví Seller khi họ vi phạm quy định sàn (bán hàng giả, chửi khách).

Acceptance Criteria (AC):

Màn hình Admin có form "Tạo quyết định xử phạt".

Input: Seller ID, Số tiền phạt, Lý do, Hình ảnh bằng chứng.

Hệ thống trừ tiền thẳng vào REVENUE_WALLET, tạo transaction type PENALTY. Gửi Email thông báo quyết định xử phạt.

[FIN-22] Quản lý Tiền cọc Đảm bảo (Security Deposit Locked Balance)

User Story: Là Sàn, tôi yêu cầu các Shop bán hàng nhạy cảm (Thực phẩm chức năng, Mỹ phẩm) phải nạp tiền cọc giữ chân (VD: 20 triệu) mới được mở bán.

Acceptance Criteria (AC):

Thêm field lockedDeposit vào Wallet.

Seller chuyển khoản nạp cọc, Admin xác nhận giao dịch.

Tiền này không thể rút. Hệ thống cấp Badge "Shop Có Cọc Đảm Bảo" trên Frontend. Cọc chỉ được hoàn trả khi Seller xóa tài khoản kinh doanh.

[FIN-23] Đối soát Thanh toán Quốc tế (Cross-border Settlement)

User Story: Là Seller nước ngoài, tôi muốn rút doanh thu VNĐ thành ngoại tệ (USD) qua các cổng Payoneer/PingPong.

Acceptance Criteria (AC):

Backend hạch toán toàn bộ số dư bằng VNĐ.

Khi tạo lệnh rút tiền quốc tế: Gọi API lấy tỷ giá hối đoái realtime (Vietcombank/SBV) để quy đổi VNĐ -> USD.

Tích hợp API Payout của Payoneer để chuyển tiền đô về tài khoản Seller.

EPIC 7: HỆ THỐNG QUẢN TRỊ VÀ BẢO MẬT (SYSTEM FOUNDATION)
[SYS-01] Phân quyền Quản trị viên (RBAC - Role-Based Access Control)

User Story: Là Global Admin, tôi muốn phân quyền linh hoạt cho nhân viên (Tài chính, Vận hành, Kiểm duyệt) để họ không thể can thiệp vào nghiệp vụ chéo.

Acceptance Criteria (AC):

UI (AdminUsers): Form cấp quyền có các checkbox: PERM_FINANCE_MASTER, PERM_CS_OPERATOR, PERM_CONTENT_MODERATOR.

UI (AdminSidebar): Đọc mảng permissions để ẩn/hiện các tab (Ví dụ: Ẩn tab "Cấu hình Tài chính" nếu không có quyền Finance).

Backend: Gắn @PreAuthorize("hasAuthority('...')") bảo vệ các Controller liên quan.

[SYS-02] Nhật ký Hoạt động Quản trị viên (Audit Trails / Activity Logs)

User Story: Là Global Admin, tôi muốn xem log mọi hành động nhạy cảm (Ai duyệt rút tiền, Ai đổi cấu hình) để dễ truy vết trách nhiệm.

Acceptance Criteria (AC):

Đã hoàn thành: Sử dụng bảng AuditLog.

Ghi log hành động, ID người thao tác, Thời gian. Không ai (kể cả Global) có quyền xóa data bảng này.