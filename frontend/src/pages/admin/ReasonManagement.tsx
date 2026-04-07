import React from 'react';
import { FaPlus, FaTrash } from 'react-icons/fa';

interface ReasonManagementProps {
  reasons: any[];
  newReasonName: string;
  setNewReasonName: (val: string) => void;
  handleAddReason: () => void;
  handleDeleteReason: (id: string) => void;
}

const ReasonManagement: React.FC<ReasonManagementProps> = ({ 
  reasons, newReasonName, setNewReasonName, handleAddReason, handleDeleteReason 
}) => (
  <div className="admin-table-container">
    <div className="reasons-header">
      <input 
        type="text" 
        placeholder="Thêm lý do báo cáo mới..." 
        value={newReasonName}
        onChange={e => setNewReasonName(e.target.value)}
      />
      <button className="btn-add-reason" onClick={handleAddReason}><FaPlus /> Thêm mới</button>
    </div>
    <table className="admin-data-table">
      <thead>
        <tr>
          <th>Tên lý do vi phạm</th>
          <th>Trạng thái</th>
          <th>Ngày tạo</th>
          <th>Thao tác</th>
        </tr>
      </thead>
      <tbody>
        {reasons.map(reason => (
          <tr key={reason.id}>
            <td><strong>{reason.name}</strong></td>
            <td><span className="status-badge active">Đang hiển thị</span></td>
            <td>{new Date(reason.createdAt).toLocaleDateString('vi-VN')}</td>
            <td className="action-btns">
              <button className="mod-btn reject" onClick={() => handleDeleteReason(reason.id)}><FaTrash /></button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default ReasonManagement;