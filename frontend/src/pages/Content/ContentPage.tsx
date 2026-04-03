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

// 🚀 Interface for search result items
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
    
    // Parse the search query from URL (e.g., ?q=hoan+tien)
    const queryParams = new URLSearchParams(location.search);
    const searchQuery = queryParams.get('q') || '';
    
    const [nodes, setNodes] = useState<HelpNode[]>([]);
    const [data, setData] = useState<PageContent | null>(null);
    const [searchResults, setSearchResults] = useState<SearchResult[]>([]); // 🚀 New State
    const [isSearchMode, setIsSearchMode] = useState(false); // 🚀 New State
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
                    if (currentNode.type === 'CATEGORY') next.add(currentNode.id);
                    return next;
                });
            }
        }
    }, [slug, nodes]);

    // 3. 🚀 FETCH LOGIC: Article Content vs. Search Results
    useEffect(() => {
        const fetchContent = async () => {
            setLoading(true);
            
            // Check if we are in Search Mode
            if (slug === 'tim-kiem') {
                setIsSearchMode(true);
                try {
                    const res = await api.get(`/system-content/search?q=${encodeURIComponent(searchQuery)}`);
                    setSearchResults(res.data || []);
                } catch (err) {
                    console.error("Search API failed", err);
                    setSearchResults([]);
                } finally {
                    setLoading(false);
                }
                return;
            }

            // Normal Article Mode
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
                console.error("Error fetching content", err);
                setData(null);
            } finally {
                setLoading(false);
            }
        };

        fetchContent();
        window.scrollTo(0, 0);
    }, [type, slug, searchQuery]); // Re-run when search query changes

    const handleCategoryClick = (node: HelpNode) => {
        toggleExpand(node.id);
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

    // 🚀 NEW: Helper to strip HTML tags for search result snippets
    const createSnippet = (html: string) => {
        const text = html.replace(/<[^>]*>?/gm, ' ');
        return text.length > 160 ? text.substring(0, 160) + '...' : text;
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
                        <p>Đang tìm kiếm nội dung...</p>
                    </div>
                ) : isSearchMode ? (
                    /* 🚀 SEARCH RESULTS UI */
                    <div className="search-results-container animate-fade-in">
                        <div className="search-results-header">
                            <h1><FaSearch /> Kết quả tìm kiếm cho: "{searchQuery}"</h1>
                            <p>Tìm thấy {searchResults.length} bài viết liên quan</p>
                        </div>
                        <hr className="header-divider" />
                        
                        {searchResults.length > 0 ? (
                            <div className="search-results-list">
                                {searchResults.map(article => (
                                    <div key={article.id} className="search-result-item" onClick={() => navigate(`/tro-giup/${article.slug}`)}>
                                        <h3>{article.title}</h3>
                                        <p className="result-snippet">{createSnippet(article.htmlContent)}</p>
                                        <span className="read-more">Xem chi tiết <FaChevronRight /></span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="no-search-results">
                                <FaInfoCircle />
                                <p>Không tìm thấy kết quả nào phù hợp với từ khóa của bạn.</p>
                                <ul>
                                    <li>Kiểm tra lại lỗi chính tả.</li>
                                    <li>Thử bằng các từ khóa ngắn gọn hơn.</li>
                                    <li>Sử dụng các thuật ngữ chung chung hơn.</li>
                                </ul>
                            </div>
                        )}
                    </div>
                ) : !data ? (
                    <div className="content-error-box">
                        <FaInfoCircle className="err-icon" />
                        <h2>Không tìm thấy nội dung</h2>
                        <p>Dường như trang bạn tìm kiếm chưa có nội dung hoặc đã bị di chuyển.</p>
                        <Link to="/" className="btn-back-home">Quay lại trang chủ</Link>
                    </div>
                ) : (
                    /* REGULAR ARTICLE UI */
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