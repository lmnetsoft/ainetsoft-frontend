import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  FaPlus, FaTrash, FaSave, FaList, FaCreditCard, 
  FaTruck, FaTimes
} from 'react-icons/fa';
import './FooterMenuManagement.css';

const FooterMenuManagement = () => {
  const [menus, setMenus] = useState<any[]>([]);
  const [icons, setIcons] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'menus' | 'icons'>('menus');
  const [savingId, setSavingId] = useState<string | null>(null);

  const [newIcon, setNewIcon] = useState({
    name: '',
    imgUrl: '',
    type: 'PAYMENT',
    active: true
  });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    try {
      if (activeTab === 'menus') {
        const res = await api.get('/footer-menus');
        setMenus(res.data || []);
      } else {
        const [resPay, resShip] = await Promise.all([
          api.get('/footer-icons/PAYMENT'),
          api.get('/footer-icons/SHIPPING')
        ]);
        setIcons([...(resPay.data || []), ...(resShip.data || [])]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Không thể tải dữ liệu.");
    }
  };

  const handleSaveIcon = async () => {
    if (!newIcon.name || !newIcon.imgUrl) {
      toast.error("Vui lòng nhập tên và đường dẫn ảnh.");
      return;
    }
    try {
      await api.post('/footer-icons', {
        name: newIcon.name,
        imgUrl: newIcon.imgUrl,
        category: newIcon.type, 
        active: newIcon.active,
        displayOrder: icons.length + 1
      }); 
      toast.success("Đã thêm icon thành công!");
      setNewIcon({ name: '', imgUrl: '', type: 'PAYMENT', active: true });
      fetchData();
    } catch (e) {
      toast.error("Lỗi khi lưu icon.");
    }
  };

  const handleDeleteIcon = async (id: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa icon này?")) return;
    try {
      await api.delete(`/footer-icons/${id}`);
      toast.success("Đã xóa icon.");
      fetchData();
    } catch (e) {
      toast.error("Lỗi khi xóa.");
    }
  };

  const addColumn = () => {
    const newCol = { 
      categoryTitle: "", 
      items: [], 
      displayOrder: (menus || []).length + 1 
    };
    setMenus([...(menus || []), newCol]);
  };

  const addItem = (menuIndex: number) => {
    const updated = [...menus];
    updated[menuIndex].items.push({ label: "", url: "", isInternal: true });
    setMenus(updated);
  };

  const saveMenu = async (menu: any, index: number) => {
    const currentId = menu.id || `new-col-${index}`;
    setSavingId(currentId);

    try {
      await api.post('/footer-menus', menu);
      toast.success("Đã lưu cột menu!");
      await fetchData();
    } catch (e) {
      toast.error("Lỗi khi lưu.");
    } finally {
      setSavingId(null);
    }
  };

  const deleteMenu = async (id: string, index: number) => {
    if (!id) {
      setMenus(menus.filter((_, i) => i !== index));
      return;
    }
    if (!window.confirm("Xóa toàn bộ cột này?")) return;
    try {
      await api.delete(`/footer-menus/${id}`);
      fetchData();
    } catch (e) {
      toast.error("Lỗi khi xóa.");
    }
  };

  return (
    <div className="admin-footer-mgmt">
      {/* 🚀 SUPREME HEADER: Centered and Uppercase Red */}
      <div className="mgmt-header centered-header">
        <h2>THIẾT LẬP FOOTER NÂNG CAO</h2>
        <p>Tùy chỉnh danh sách liên kết và các biểu tượng đối tác hiển thị ở chân trang</p>
        
        <div className="mgmt-tabs">
          <button className={activeTab === 'menus' ? 'active' : ''} onClick={() => setActiveTab('menus')}>
            <FaList /> CỘT DANH MỤC
          </button>
          <button className={activeTab === 'icons' ? 'active' : ''} onClick={() => setActiveTab('icons')}>
            <FaCreditCard /> ICONS ĐỐI TÁC
          </button>
        </div>
      </div>

      <hr className="supreme-divider" />

      {activeTab === 'menus' ? (
        /* 🚀 THE FIX: Added 'vertical-stack' to match the new CSS layout */
        <div className="menu-grid vertical-stack">
          {(menus || []).map((menu, mIdx) => {
            const currentSaving = savingId === (menu.id || `new-col-${mIdx}`);
            
            return (
              <div key={menu.id || mIdx} className="menu-col-card">
                <div className="card-header">
                  <input 
                    placeholder="NHẬP TÊN CỘT..."
                    autoFocus={!menu.id} 
                    value={menu.categoryTitle} 
                    onChange={(e) => {
                      const up = [...menus];
                      up[mIdx].categoryTitle = e.target.value;
                      setMenus(up);
                    }}
                  />
                  <button className="btn-del" onClick={() => deleteMenu(menu.id, mIdx)}><FaTrash /></button>
                </div>
                
                <div className="menu-items-list">
                  {menu.items.map((item: any, iIdx: number) => (
                    <div key={iIdx} className="item-row">
                      <input 
                        placeholder="Nhãn (vd: Trợ giúp)" 
                        value={item.label}
                        onChange={(e) => {
                          const up = [...menus];
                          up[mIdx].items[iIdx].label = e.target.value;
                          setMenus(up);
                        }}
                      />
                      <input 
                        placeholder="Slug/URL" 
                        value={item.url}
                        onChange={(e) => {
                          const up = [...menus];
                          up[mIdx].items[iIdx].url = e.target.value;
                          setMenus(up);
                        }}
                      />
                      <select 
                        value={item.isInternal ? 'true' : 'false'}
                        onChange={(e) => {
                          const up = [...menus];
                          up[mIdx].items[iIdx].isInternal = e.target.value === 'true';
                          setMenus(up);
                        }}
                      >
                        <option value="true">Nội bộ</option>
                        <option value="false">Ngoài</option>
                      </select>
                    </div>
                  ))}
                  <button className="btn-add-item" onClick={() => addItem(mIdx)}><FaPlus /> THÊM LINK</button>
                </div>
                
                <button 
                  className="btn-save-col" 
                  onClick={() => saveMenu(menu, mIdx)}
                  disabled={currentSaving}
                >
                  {currentSaving ? "ĐANG LƯU..." : <><FaSave /> LƯU CỘT</>}
                </button>
              </div>
            );
          })}
          <button className="add-col-card" onClick={addColumn}><FaPlus /> THÊM CỘT MỚI</button>
        </div>
      ) : (
        <div className="icons-manager">
          <div className="icon-add-form">
            <h4 className="form-title">THÊM ICON ĐỐI TÁC MỚI</h4>
            <div className="form-inputs">
              <input 
                placeholder="Tên đối tác (vd: Visa)" 
                value={newIcon.name}
                onChange={(e) => setNewIcon({...newIcon, name: e.target.value})}
              />
              <input 
                placeholder="URL ảnh" 
                value={newIcon.imgUrl}
                onChange={(e) => setNewIcon({...newIcon, imgUrl: e.target.value})}
              />
              <select 
                value={newIcon.type}
                onChange={(e) => setNewIcon({...newIcon, type: e.target.value})}
              >
                <option value="PAYMENT">THANH TOÁN</option>
                <option value="SHIPPING">VẬN CHUYỂN</option>
              </select>
              <button onClick={handleSaveIcon} className="btn-primary-add">
                <FaPlus /> THÊM
              </button>
            </div>
          </div>

          <div className="icon-sections">
            <section className="icon-sec">
              <h5><FaCreditCard /> PHƯƠNG THỨC THANH TOÁN</h5>
              <div className="icon-display-grid">
                {icons.filter(i => i.category === 'PAYMENT').map(icon => (
                  <div key={icon.id} className="admin-icon-card">
                    <img src={icon.imgUrl} alt={icon.name} />
                    <span>{icon.name}</span>
                    <button className="mini-del" onClick={() => handleDeleteIcon(icon.id)}><FaTimes /></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="icon-sec">
              <h5><FaTruck /> ĐƠN VỊ VẬN CHUYỂN</h5>
              <div className="icon-display-grid">
                {icons.filter(i => i.category === 'SHIPPING').map(icon => (
                  <div key={icon.id} className="admin-icon-card">
                    <img src={icon.imgUrl} alt={icon.name} />
                    <span>{icon.name}</span>
                    <button className="mini-del" onClick={() => handleDeleteIcon(icon.id)}><FaTimes /></button>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default FooterMenuManagement;