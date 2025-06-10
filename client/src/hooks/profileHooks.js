import { useState, useEffect, useCallback } from "react";

/**
 * Debounced Search Hook
 * Optimizes search performance by debouncing input
 */
export const useDebouncedSearch = (initialValue = "", delay = 300) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState(initialValue);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [searchTerm, delay]);

  return [searchTerm, setSearchTerm, debouncedSearchTerm];
};

/**
 * Optimized Form Hook
 * Reduces re-renders by batching form updates
 */
export const useOptimizedForm = (initialValues = {}) => {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const setValue = useCallback((name, value) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  }, []);

  const setError = useCallback((name, error) => {
    setErrors((prev) => ({ ...prev, [name]: error }));
  }, []);

  const setTouchedField = useCallback((name, isTouched = true) => {
    setTouched((prev) => ({ ...prev, [name]: isTouched }));
  }, []);

  const resetForm = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  const handleChange = useCallback(
    (e) => {
      const { name, value, type, checked } = e.target;
      setValue(name, type === "checkbox" ? checked : value);
    },
    [setValue]
  );

  const handleBlur = useCallback(
    (e) => {
      const { name } = e.target;
      setTouchedField(name, true);
    },
    [setTouchedField]
  );

  return {
    values,
    errors,
    touched,
    setValue,
    setError,
    setTouched: setTouchedField,
    resetForm,
    handleChange,
    handleBlur,
  };
};
