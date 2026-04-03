import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate, useLocation } from 'react-router-dom';
import { FaInfoCircle, FaChevronRight, FaChevronDown, FaBookOpen, FaLifeRing, FaSearch } from 'react-icons/fa';
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

interface SearchResult {
    id: string;
    title: string;
    slug: string;
    htmlContent: string;
}

const ContentPage = ({ type }: { type?: 'regulations' | 'contact' }) => {
    const { slug } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('q') || '';
    
    const [nodes, setNodes] = useState<HelpNode[]>([]);
    const [data, setData] = useState<PageContent | null>(null);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
    const [isSearchMode, setIsSearchMode] = useState(false);
    const [loading, setLoading] = useState(true);
    const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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

    useEffect(() => {
        if (slug && nodes.length > 0) {
            const currentNode = nodes.find(n => n.slug === slug);
            if (currentNode) {
                setExpandedNodes(prev => {
                    const next = new Set(prev);
                    if (currentNode.parentId) next.add(currentNode.parentId);
                    if (currentNode.type === 'CATEGORY') next.add(currentNode.id);
                    return next;
                });
            }
        }
    }, [slug, nodes]);

    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            if (slug === 'tim-kiem') {
                setIsSearchMode(true);
                try {
                    const res = await api.get(`/system-content/search?q=${encodeURIComponent(searchQuery)}`);
                    setSearchResults(res.data || []);
                } catch (err) {
                    setSearchResults([]);
                } finally {
                    setLoading(false);
                }
                return;
            }

            setIsSearchMode(false);
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
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
        window.scrollTo(0, 0);
    }, [type, slug, searchQuery]);

    const handleCategoryClick = (node: HelpNode) => {
        setExpandedNodes(prev => {
            const next = new Set(prev);
            if (next.has(node.id)) next.delete(node.id);
            else next.add(node.id);
            return next;
        });
        if (node.slug) navigate(`/tro-giup/${node.slug}`);
    };

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

    const createSnippet = (html: string) => {
        const text = html.replace(/<[^>]*>?/gm, ' ');
        return text.length > 160 ? text.substring(0, 160) + '...' : text;
    };

    return (
        <div className="help-center-layout">
            {/* 🚀 THE FIX: Single container holding both sides so they are always the same height */}
            <div className="help-main-container animate-fade-in">
                
                <aside className="help-sidebar">
                    <div className="sidebar-sticky-box">
                        <div className="sidebar-top-header">
                            <FaLifeRing />
                            <h3>Trung Tâm Trợ Giúp</h3>
                        </div>
                        <div className="tree-navigation">
                            {nodes.length > 0 ? renderSidebarTree(null) : <p className="empty-tree">Đang tải...</p>}
                        </div>
                    </div>
                </aside>

                <main className="help-content-area">
                    {loading ? (
                        <div className="content-loading-spinner">
                            <div className="spinner"></div>
                        </div>
                    ) : isSearchMode ? (
                        <div className="search-results-content">
                            <div className="search-results-header">
                                <h1><FaSearch /> Kết quả cho: "{searchQuery}"</h1>
                                <p>Tìm thấy {searchResults.length} bài viết</p>
                            </div>
                            <hr className="header-divider" />
                            <div className="search-results-list">
                                {searchResults.map(article => (
                                    <div key={article.id} className="search-result-item" onClick={() => navigate(`/tro-giup/${article.slug}`)}>
                                        <h3>{article.title}</h3>
                                        <p className="result-snippet">{createSnippet(article.htmlContent)}</p>
                                        <p className="read-more">Xem chi tiết <FaChevronRight /></p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : !data ? (
                        <div className="content-error-box">
                            <FaInfoCircle className="err-icon" />
                            <h2>Không tìm thấy nội dung</h2>
                            <Link to="/" className="btn-back-home">Quay lại trang chủ</Link>
                        </div>
                    ) : (
                        <div className="article-body">
                            <div className="content-header">
                                <h1>{data.title}</h1>
                                <p className="last-updated">Cập nhật lần cuối: {new Date(data.lastUpdated).toLocaleDateString('vi-VN')}</p>
                            </div>
                            <hr className="header-divider" />
                            <div className="dynamic-html-content ql-editor" dangerouslySetInnerHTML={{ __html: data.htmlContent }} />
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default ContentPage;