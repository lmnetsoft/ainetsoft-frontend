import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { toast } from 'react-hot-toast';
import { 
  FaFolderPlus, FaFileMedical, FaChevronRight, FaChevronDown, 
  FaTrash, FaSave, FaSitemap, FaLink 
} from 'react-icons/fa';
import './HelpHierarchyManagement.css';

interface HelpNode {
  id?: string;
  title: string;
  slug: string;
  parentId: string | null;
  type: 'CATEGORY' | 'ARTICLE';
  displayOrder: number;
}

const HelpHierarchyManagement = () => {
  const [nodes, setNodes] = useState<HelpNode[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTree();
  }, []);

  const fetchTree = async () => {
    try {
      setLoading(true);
      const res = await api.get('/help/tree');
      setNodes(res.data);
    } catch (e) {
      toast.error("Không thể tải cấu trúc cây trợ giúp.");
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const handleAddNode = (parentId: string | null, type: 'CATEGORY' | 'ARTICLE') => {
    const newNode: HelpNode = {
      title: type === 'CATEGORY' ? "Danh mục mới" : "Bài viết mới",
      slug: "",
      parentId: parentId,
      type: type,
      displayOrder: nodes.filter(n => n.parentId === parentId).length + 1
    };
    // For UI purposes, we'll save it immediately to get an ID or handle it locally
    saveNode(newNode);
  };

  const saveNode = async (node: HelpNode) => {
    try {
      await api.post('/help/nodes', node);
      toast.success("Đã cập nhật cấu trúc!");
      fetchTree();
    } catch (e) {
      toast.error("Lỗi khi lưu.");
    }
  };

  const deleteNode = async (id: string) => {
    if (!window.confirm("Xóa mục này sẽ xóa tất cả nội dung bên trong. Tiếp tục?")) return;
    try {
      await api.delete(`/help/nodes/${id}`);
      toast.success("Đã xóa.");
      fetchTree();
    } catch (e) {
      toast.error("Lỗi khi xóa.");
    }
  };

  // 🚀 Recursive function to render the Tree UI
  const renderTree = (parentId: string | null, level: number = 0) => {
    return nodes
      .filter(node => node.parentId === parentId)
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(node => (
        <div key={node.id} className="tree-node-wrapper" style={{ marginLeft: `${level * 20}px` }}>
          <div className={`tree-node-item ${node.type === 'CATEGORY' ? 'is-folder' : 'is-article'}`}>
            <div className="node-info" onClick={() => node.id && toggleExpand(node.id)}>
              {node.type === 'CATEGORY' && (expandedNodes.has(node.id!) ? <FaChevronDown /> : <FaChevronRight />)}
              <input 
                className="node-title-input"
                value={node.title}
                onChange={(e) => {
                  const updated = nodes.map(n => n.id === node.id ? { ...n, title: e.target.value } : n);
                  setNodes(updated);
                }}
                onBlur={() => saveNode(node)}
              />
              {node.type === 'ARTICLE' && (
                <div className="node-slug-box">
                  <FaLink />
                  <input 
                    placeholder="Slug bài viết..."
                    value={node.slug}
                    onChange={(e) => {
                      const updated = nodes.map(n => n.id === node.id ? { ...n, slug: e.target.value } : n);
                      setNodes(updated);
                    }}
                    onBlur={() => saveNode(node)}
                  />
                </div>
              )}
            </div>
            
            <div className="node-actions">
              {node.type === 'CATEGORY' && (
                <>
                  <button title="Thêm danh mục con" onClick={() => handleAddNode(node.id!, 'CATEGORY')}><FaFolderPlus /></button>
                  <button title="Thêm bài viết" onClick={() => handleAddNode(node.id!, 'ARTICLE')}><FaFileMedical /></button>
                </>
              )}
              <button className="btn-delete" onClick={() => deleteNode(node.id!)}><FaTrash /></button>
            </div>
          </div>
          {node.type === 'CATEGORY' && expandedNodes.has(node.id!) && renderTree(node.id!, level + 1)}
        </div>
      ));
  };

  return (
    <div className="help-hierarchy-mgmt">
      <div className="mgmt-header">
        <h2><FaSitemap /> Quản lý Phân cấp Trợ giúp</h2>
        <p>Tạo danh mục cha-con và liên kết với các bài viết Marketing đã soạn thảo.</p>
        <button className="btn-add-root" onClick={() => handleAddNode(null, 'CATEGORY')}>
          <FaFolderPlus /> Thêm Danh mục Chính
        </button>
      </div>

      <div className="tree-container">
        {loading ? <div className="loading">Đang tải cấu trúc...</div> : renderTree(null)}
      </div>
    </div>
  );
};

export default HelpHierarchyManagement;