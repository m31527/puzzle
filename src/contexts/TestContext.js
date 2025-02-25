import React, { createContext, useContext } from 'react';

export const TestContext = createContext(null);

export const TestProvider = ({ children, testGenerator }) => {
  return (
    <TestContext.Provider value={testGenerator}>
      {children}
    </TestContext.Provider>
  );
};

export const useTest = () => {
  const context = useContext(TestContext);
  // 不拋出錯誤，而是返回 null
  return context;
};
