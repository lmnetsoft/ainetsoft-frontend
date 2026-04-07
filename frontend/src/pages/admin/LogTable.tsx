import React from 'react';

interface LogTableProps {
  logs: any[];
}

const LogTable: React.FC<LogTableProps> = ({ logs }) => (
  <div className="admin-table-container">
    <table className="admin-data-table">
      <thead>
        <tr>
          <th>Thời gian</th>
          <th>Admin</th>
          <th>Hành động</th>
          <th>Đối tượng</th>
          <th>Chi tiết</th>
        </tr>
      </thead>
      <tbody>
        {logs.length === 0 ? (
          <tr><td colSpan={5} className="empty-row">Chưa có nhật ký hoạt động nào.</td></tr>
        ) : (
          logs.map(log => (
            <tr key={log.id}>
              <td><small>{new Date(log.timestamp).toLocaleString('vi-VN')}</small></td>
              <td><strong>{log.adminEmail}</strong></td>
              <td><span className="action-tag">{log.actionType}</span></td>
              <td>{log.targetName}</td>
              <td className="comment-cell">{log.description}</td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
);

export default LogTable;