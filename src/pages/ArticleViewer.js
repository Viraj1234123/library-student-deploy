import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import API from "../api";
import "./ArticleViewer.css";

const ArticleViewer = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [article, setArticle] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pageImage, setPageImage] = useState(null);

  useEffect(() => {
    const fetchArticleMetadata = async () => {
      try {
        setIsLoading(true);
        const response = await API.get(`article-sharing/view?id=${id}`);
        const articleData = response.data.data.article;
        setArticle(articleData);
        setTotalPages(articleData.pageCount);
      } catch (err) {
        console.error("Error fetching article:", err);
        if (err.response?.status === 403) {
          setError("You don't have permission to view this article.");
        } else if (err.response?.status === 400) {
          setError("This article is no longer available or has expired.");
        } else {
          setError("Failed to load the article. Please try again later.");
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchArticleMetadata();
  }, [id]);

  // Fetch the image for the current page
  useEffect(() => {
    if (!article) return;
    
    const fetchPageImage = async () => {
      try {
        setIsLoading(true);
        
        // Make request with responseType 'blob' to handle binary data
        const response = await API.get(`article-sharing/view?id=${id}&page=${currentPage}`, {
          responseType: 'blob'
        });
        
        // Create a URL for the blob
        const imageUrl = URL.createObjectURL(response.data);
        setPageImage(imageUrl);
      } catch (err) {
        console.error("Error fetching page image:", err);
        setError("Failed to load the page image. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPageImage();
    
    // Clean up the blob URL when component unmounts or when page changes
    return () => {
      if (pageImage) {
        URL.revokeObjectURL(pageImage);
      }
    };
  }, [id, currentPage, article]);

  const handleBack = () => {
    navigate("/my-articles");
  };

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  if (isLoading && !article) {
    return (
      <div className="article-viewer-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading article...</p>
        </div>
      </div>
    );
  }

  if (error && !article) {
    return (
      <div className="article-viewer-container">
        <div className="error-message">
          <h2>Error</h2>
          <p>{error}</p>
          <button onClick={handleBack}>Back to My Articles</button>
        </div>
      </div>
    );
  }

  if (!article) {
    return (
      <div className="article-viewer-container">
        <div className="error-message">
          <h2>Article Not Found</h2>
          <p>The requested article could not be found.</p>
          <button onClick={handleBack}>Back to My Articles</button>
        </div>
      </div>
    );
  }

  return (
    <div className="article-viewer-container">
      <div className="article-viewer-header">
        <div className="article-info">
          <h1>{article.title}</h1>
          <p><strong>DOI:</strong> {article.DOI}</p>
        </div>
        
        <div className="article-controls">
          <button className="back-button" onClick={handleBack}>
            Back to My Articles
          </button>
        </div>
      </div>

      <div className="article-content">
        <div className="page-viewer">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading page {currentPage}...</p>
            </div>
          ) : pageImage ? (
            <img 
              src={pageImage} 
              alt={`Page ${currentPage}`} 
              className="page-image"
            />
          ) : (
            <div className="error-message">
              <p>Failed to load page image.</p>
            </div>
          )}
        </div>
        
        <div className="page-navigation">
          <button 
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
          >
            Previous
          </button>
          
          <span className="page-indicator">
            Page {currentPage} of {totalPages}
          </span>
          
          <input
            type="number"
            min="1"
            max={totalPages}
            value={currentPage}
            onChange={(e) => handlePageChange(parseInt(e.target.value) || 1)}
            className="page-input"
            disabled={isLoading}
          />
          
          <button 
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
          >
            Next
          </button>
        </div>
      </div>

      {article.abstract && (
        <div className="article-abstract">
          <h3>Abstract</h3>
          <p>{article.abstract}</p>
        </div>
      )}
    </div>
  );
};

export default ArticleViewer;