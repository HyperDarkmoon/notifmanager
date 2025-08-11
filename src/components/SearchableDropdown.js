import React, { useState, useRef, useEffect } from 'react';

const SearchableDropdown = ({ 
  options = [], 
  selectedValues = [], 
  onSelectionChange, 
  placeholder = "Search and select...", 
  multiple = true,
  isLoading = false,
  emptyMessage = "No options available"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const inputRef = useRef(null);

  // Filter options based on search term
  const filteredOptions = options.filter(option => 
    option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    option.value.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle clicking outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle option selection
  const handleOptionClick = (optionValue) => {
    if (multiple) {
      const newSelection = selectedValues.includes(optionValue)
        ? selectedValues.filter(val => val !== optionValue)
        : [...selectedValues, optionValue];
      onSelectionChange(newSelection);
    } else {
      onSelectionChange(optionValue); // Single value for filter mode
      setIsOpen(false);
      setSearchTerm('');
    }
  };

  // Handle removing selected item
  const handleRemoveItem = (itemValue, event) => {
    event.stopPropagation();
    const newSelection = selectedValues.filter(val => val !== itemValue);
    onSelectionChange(newSelection);
  };

  // Get display text for selected items
  const getSelectedItemsDisplay = () => {
    if (multiple) {
      if (selectedValues.length === 0) return placeholder;
      if (selectedValues.length === 1) {
        const selectedOption = options.find(opt => opt.value === selectedValues[0]);
        return selectedOption ? selectedOption.label : selectedValues[0];
      }
      return `${selectedValues.length} TVs selected`;
    } else {
      // Single selection mode
      if (!selectedValues) return placeholder;
      const selectedOption = options.find(opt => opt.value === selectedValues);
      return selectedOption ? selectedOption.label : selectedValues;
    }
  };

  return (
    <div className="searchable-dropdown" ref={dropdownRef}>
      {/* Main dropdown trigger */}
      <div 
        className={`dropdown-trigger ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="dropdown-display">
          {multiple && selectedValues.length > 0 ? (
            <div className="selected-items">
              {selectedValues.map(value => {
                const option = options.find(opt => opt.value === value);
                return (
                  <span key={value} className="selected-item">
                    <span className="item-icon">{option?.icon || '📺'}</span>
                    <span className="item-label">{option?.label || value}</span>
                    <button
                      type="button"
                      className="remove-item"
                      onClick={(e) => handleRemoveItem(value, e)}
                      title="Remove"
                    >
                      ✕
                    </button>
                  </span>
                );
              })}
            </div>
          ) : (
            <span className={`placeholder ${
              (multiple && selectedValues.length === 0) || (!multiple && !selectedValues) ? 'empty' : ''
            }`}>
              {getSelectedItemsDisplay()}
            </span>
          )}
        </div>
        <div className="dropdown-arrow">
          {isOpen ? '▲' : '▼'}
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="dropdown-menu">
          {/* Search input */}
          <div className="search-container">
            <input
              ref={inputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search TVs..."
              className="search-input"
              autoFocus
            />
            <div className="search-icon">🔍</div>
          </div>

          {/* Options list */}
          <div className="options-list">
            {isLoading ? (
              <div className="dropdown-loading">Loading TVs...</div>
            ) : filteredOptions.length === 0 ? (
              <div className="no-options">
                {searchTerm ? `No TVs found for "${searchTerm}"` : emptyMessage}
              </div>
            ) : (
              filteredOptions.map(option => (
                <div
                  key={option.value}
                  className={`dropdown-option ${
                    multiple 
                      ? selectedValues.includes(option.value) 
                      : selectedValues === option.value
                    ? 'selected' : ''
                  }`}
                  onClick={() => handleOptionClick(option.value)}
                >
                  <div className="option-content">
                    <span className="option-icon">{option.icon || '📺'}</span>
                    <div className="option-text">
                      <span className="option-label">{option.label}</span>
                      {option.location && (
                        <span className="option-location">📍 {option.location}</span>
                      )}
                    </div>
                  </div>
                  {(multiple 
                    ? selectedValues.includes(option.value) 
                    : selectedValues === option.value) && (
                    <div className="option-checkmark">✓</div>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Selection summary */}
          {multiple && selectedValues.length > 0 && (
            <div className="selection-summary">
              <span>{selectedValues.length} TV{selectedValues.length !== 1 ? 's' : ''} selected</span>
              {selectedValues.length > 0 && (
                <button
                  type="button"
                  className="clear-all"
                  onClick={() => onSelectionChange([])}
                >
                  Clear All
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SearchableDropdown;
