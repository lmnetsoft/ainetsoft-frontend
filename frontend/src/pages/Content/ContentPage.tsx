import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { FaInfoCircle, FaChevronRight, FaChevronDown, FaBookOpen, FaLifeRing } from 'react-icons/fa';
import api from '../../services/api';
import './ContentPage.css';

interface HelpNode {
    id: string;
    title: string;
    slug: string;
    parentId: string | null;
    type: 'CATEGORY' | 'ARTICLE';
}

interface PageContent {
    title: string;
    lastUpdated: string;
    htmlContent: string;
}

const ContentPage = ({ type }: { type?: 'regulations' | 'contact' }) => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const [nodes, setNodes] = useState<HelpNode[]>([]);
    const [data, setData] = useState<PageContent | null>(null);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

    // 1. Fetch the Sidebar Hierarchy Tree
    useEffect(() => {
        const fetchTree = async () => {
            try {
                const res = await api.get('/help/tree');
                setNodes(res.data || []);
            } catch (e) {
                console.error("Error fetching help tree", e);
            }
        };
        fetchTree();
    }, []);

    // 2. Auto-Expand Categories based on the current URL Slug
    useEffect(() => {
        if (slug && nodes.length > 0) {
            const currentNode = nodes.find(n => n.slug === slug);
            if (currentNode) {
                setExpandedNodes(prev => {
                    const next = new Set(prev);
                    if (currentNode.parentId) next.add(currentNode.parentId);
                    // If the current page is a category, expand it too
                    if (currentNode.type === 'CATEGORY') next.add(currentNode.id);
                    return next;
                });
            }
        }
    }, [slug, nodes]);

    // 3. Fetch Main Article Content
    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            const targetSlug = type || slug;
            
            if (!targetSlug) {
                setLoading(false);
                return;
            }

            try {
                const res = await api.get(`/system-content/${targetSlug}`);
                if (res.data) {
                    setData({
                        title: res.data.title,
                        lastUpdated: res.data.lastUpdated || new Date().toISOString(),
                        htmlContent: res.data.htmlContent
                    });
                } else {
                    setData(null);
                }
            } catch (err) {
                console.error("Error fetching content", err);
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
        window.scrollTo(0, 0);
    }, [type, slug]);

    // 🚀 Logic: Categories now Navigate AND Toggle Expand/Collapse
    const handleCategoryClick = (node: HelpNode) => {
        // Toggle the folder view
        toggleExpand(node.id);
        
        // Navigate to the content if a slug exists
        if (node.slug) {
            navigate(`/tro-giup/${node.slug}`);
        }
    };

    const toggleExpand = (id: string) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // Recursive Sidebar Renderer
    const renderSidebarTree = (parentId: string | null) => {
        return nodes
            .filter(node => node.parentId === parentId)
            .map(node => (
                <div key={node.id} className="sidebar-node-wrapper">
                    {node.type === 'CATEGORY' ? (
                        <div className="category-group">
                            <div 
                                className={`sidebar-category-header ${expandedNodes.has(node.id) ? 'open' : ''} ${slug === node.slug ? 'active-cat' : ''}`} 
                                onClick={() => handleCategoryClick(node)}
                            >
                                {expandedNodes.has(node.id) ? <FaChevronDown className="chevron" /> : <FaChevronRight className="chevron" />}
                                <span>{node.title}</span>
                            </div>
                            {expandedNodes.has(node.id) && (
                                <div className="sidebar-sub-items">
                                    {renderSidebarTree(node.id)}
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link 
                            to={`/tro-giup/${node.slug}`} 
                            className={`sidebar-article-link ${slug === node.slug ? 'active' : ''}`}
                        >
                            <FaBookOpen className="art-icon" />
                            <span>{node.title}</span>
                        </Link>
                    )}
                </div>
            ));
    };

    return (
        <div className="help-center-layout">
            <aside className="help-sidebar">
                <div className="sidebar-inner">
                    <div className="sidebar-top-header">
                        <FaLifeRing />
                        <h3>Trung Tâm Trợ Giúp</h3>
                    </div>
                    <div className="tree-navigation">
                        {nodes.length > 0 ? renderSidebarTree(null) : <p className="empty-tree">Đang tải menu...</p>}
                    </div>
                </div>
            </aside>

            <main className="help-content-area">
                {loading ? (
                    <div className="content-loading-spinner">
                        <div className="spinner"></div>
                        <p>Đang tải nội dung...</p>
                    </div>
                ) : !data ? (
                    <div className="content-error-box">
                        <FaInfoCircle className="err-icon" />
                        <h2>Không tìm thấy nội dung</h2>
                        <p>Dường như trang bạn tìm kiếm chưa có nội dung hoặc đã bị di chuyển.</p>
                        <Link to="/" className="btn-back-home">Quay lại trang chủ</Link>
                    </div>
                ) : (
                    <div className="content-card animate-fade-in">
                        <div className="content-header">
                            <h1>{data.title}</h1>
                            <div className="meta-info">
                                <span className="last-updated">
                                    Cập nhật lần cuối: {new Date(data.lastUpdated).toLocaleDateString('vi-VN')}
                                </span>
                            </div>
                        </div>
                        <hr className="header-divider" />
                        <div 
                            className="dynamic-html-content ql-editor" 
                            dangerouslySetInnerHTML={{ __html: data.htmlContent }} 
                        />
                    </div>
                )}
            </main>
        </div>
    );
};

export default ContentPage;