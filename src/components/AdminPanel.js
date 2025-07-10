import React, { useState, useEffect } from 'react';
import '../styles/admin.css';

function AdminPanel() {
  const [selectedTV, setSelectedTV] = useState(1);
  const [contentType, setContentType] = useState('file'); // 'file' or 'embed'
  const [embedText, setEmbedText] = useState('');
  const [file, setFile] = useState(null);
  const [fileName, setFileName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [isError, setIsError] = useState(false);
  const [currentUploads, setCurrentUploads] = useState({
    1: null,
    2: null,
    3: null,
    4: null
  });

  // Load current uploads for each TV
  useEffect(() => {
    fetchCurrentUploads();
  }, []);

  const fetchCurrentUploads = async () => {
    try {
      // This would be replaced with an actual API call to your backend
      // For now, we'll just simulate it
      console.log('Fetching current uploads from server...');
      
      // Get uploads from localStorage for development
      const tvUploads = JSON.parse(localStorage.getItem('tvUploads') || '{}');
      
      // Update the state with the uploads
      setCurrentUploads(prevState => ({
        1: tvUploads['1'] || null,
        2: tvUploads['2'] || null,
        3: tvUploads['3'] || null,
        4: tvUploads['4'] || null
      }));
      
      // In production, this would be:
      // const response = await fetch('http://localhost:8090/api/admin/uploads');
      // const data = await response.json();
      // setCurrentUploads(data);
    } catch (error) {
      console.error('Error fetching current uploads:', error);
    }
  };

  const handleTVSelect = (tv) => {
    setSelectedTV(tv);
  };

  const handleContentTypeChange = (type) => {
    setContentType(type);
    // Reset fields
    setEmbedText('');
    setFile(null);
    setFileName('');
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setFileName(selectedFile.name);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage('');
    setIsError(false);

    try {
      // Validate form
      if (contentType === 'file' && !file) {
        throw new Error('Please select a file to upload');
      }
      
      if (contentType === 'embed' && !embedText.trim()) {
        throw new Error('Please enter embed text');
      }

      // Create form data for the upload
      const formData = new FormData();
      formData.append('tvId', selectedTV);
      formData.append('contentType', contentType);
      
      if (contentType === 'file') {
        formData.append('file', file);
      } else {
        formData.append('embedText', embedText);
      }

      // This would be replaced with an actual API call to your backend
      // For now, we'll just simulate it
      console.log('Simulating upload to server...', {
        tv: selectedTV,
        contentType,
        file: file ? file.name : null,
        embedText: contentType === 'embed' ? embedText : null
      });

      // Simulated successful response
      // In a real app, you would do:
      // const response = await fetch('http://localhost:8090/api/admin/upload', {
      //   method: 'POST',
      //   body: formData
      // });
      // if (!response.ok) throw new Error('Upload failed');
      // const data = await response.json();
      
      // For development, we'll store content in localStorage to be accessed by TV components
      const tvUploads = JSON.parse(localStorage.getItem('tvUploads') || '{}');
      
      tvUploads[selectedTV] = contentType === 'file' 
        ? { type: 'file', name: fileName, timestamp: new Date().toISOString() } 
        : { type: 'embed', content: embedText, timestamp: new Date().toISOString() };
        
      localStorage.setItem('tvUploads', JSON.stringify(tvUploads));
      
      // Update the current uploads display
      setCurrentUploads(prev => ({
        ...prev,
        [selectedTV]: tvUploads[selectedTV]
      }));

      setMessage(`Content for TV ${selectedTV} has been updated successfully!`);
      
      // Reset form
      if (contentType === 'file') {
        setFile(null);
        setFileName('');
      } else {
        setEmbedText('');
      }
      
    } catch (error) {
      console.error('Submission error:', error);
      setMessage(error.message || 'Failed to update content');
      setIsError(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="admin-panel">
      <div className="admin-header">
        <h1>TV Content Management Panel</h1>
        <p className="admin-subtitle">Upload content or embed code for TVs</p>
      </div>

      <div className="admin-content">
        <div className="admin-form-container">
          <form onSubmit={handleSubmit} className="admin-form">
            <div className="form-section">
              <h2>1. Select Target TV</h2>
              <div className="tv-selector">
                {[1, 2, 3, 4].map(tv => (
                  <button 
                    key={tv}
                    type="button"
                    className={`tv-select-btn ${selectedTV === tv ? 'selected' : ''}`}
                    onClick={() => handleTVSelect(tv)}
                  >
                    <span className="tv-icon">📺</span>
                    <span>TV {tv}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="form-section">
              <h2>2. Select Content Type</h2>
              <div className="content-type-selector">
                <label className={`content-type-option ${contentType === 'file' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="contentType" 
                    value="file" 
                    checked={contentType === 'file'} 
                    onChange={() => handleContentTypeChange('file')} 
                  />
                  <span className="content-type-icon">📄</span>
                  <span>Upload File</span>
                </label>
                
                <label className={`content-type-option ${contentType === 'embed' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="contentType" 
                    value="embed" 
                    checked={contentType === 'embed'} 
                    onChange={() => handleContentTypeChange('embed')} 
                  />
                  <span className="content-type-icon">📝</span>
                  <span>Embed Text</span>
                </label>
              </div>
            </div>

            <div className="form-section">
              <h2>3. Add Content</h2>
              
              {contentType === 'file' && (
                <div className="file-upload-container">
                  <label className="file-upload-label">
                    {fileName ? (
                      <div className="selected-file">
                        <span className="file-name">{fileName}</span>
                        <button 
                          type="button" 
                          className="remove-file-btn"
                          onClick={() => { setFile(null); setFileName(''); }}
                        >
                          ✖
                        </button>
                      </div>
                    ) : (
                      <>
                        <span className="upload-icon">📤</span>
                        <span>Select File</span>
                      </>
                    )}
                    <input 
                      type="file" 
                      className="file-input" 
                      onChange={handleFileChange} 
                      accept="image/*,video/*,application/pdf" 
                    />
                  </label>
                  <p className="upload-help">Supported formats: Images, Videos, PDFs</p>
                </div>
              )}

              {contentType === 'embed' && (
                <div className="embed-container">
                  <label htmlFor="embedText" className="form-label">Embed Code/Text</label>
                  <textarea 
                    id="embedText"
                    className="embed-textarea"
                    value={embedText}
                    onChange={(e) => setEmbedText(e.target.value)}
                    placeholder="Enter HTML embed code or text content..."
                    rows={8}
                  ></textarea>
                </div>
              )}
            </div>

            {message && (
              <div className={`submission-message ${isError ? 'error' : 'success'}`}>
                {message}
              </div>
            )}

            <div className="form-actions">
              <button 
                type="submit" 
                className="admin-submit-btn"
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Updating...' : 'Update TV Content'}
              </button>
            </div>
          </form>
        </div>

        <div className="current-uploads-section">
          <h2>Current TV Contents</h2>
          <div className="uploads-grid">
            {[1, 2, 3, 4].map(tv => (
              <div key={tv} className="tv-upload-card">
                <h3>TV {tv}</h3>
                <div className="upload-content">
                  {currentUploads[tv] ? (
                    currentUploads[tv].type === 'file' ? (
                      <div className="upload-file-info">
                        <span className="file-type-icon">📄</span>
                        <span className="file-name">{currentUploads[tv].name}</span>
                      </div>
                    ) : (
                      <div className="upload-embed-info">
                        <span className="embed-type-icon">📝</span>
                        <span className="embed-preview">
                          {currentUploads[tv].content.substring(0, 50)}
                          {currentUploads[tv].content.length > 50 ? '...' : ''}
                        </span>
                      </div>
                    )
                  ) : (
                    <div className="no-content">
                      <span className="empty-icon">🚫</span>
                      <span>No custom content</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminPanel;
