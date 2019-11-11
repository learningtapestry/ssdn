import React, { DependencyList, Dispatch, SetStateAction, useCallback, useState } from "react";

// tslint:disable: no-empty
const useModal = (
  openSideEffect: [(...args: any[]) => any, DependencyList] = [() => {}, []],
  closeSideEffect: [(...args: any[]) => any, DependencyList] = [() => {}, []],
): [
  boolean,
  Dispatch<SetStateAction<boolean>>,
  (...args: any[]) => any,
  (...args: any[]) => any,
] => {
  const [visible, setVisible] = useState(false);
  const openFn = useCallback((...args) => {
    setVisible(true);
    openSideEffect[0](...args);
  }, openSideEffect[1]);
  const closeFn = useCallback((...args) => {
    setVisible(false);
    closeSideEffect[0](...args);
  }, closeSideEffect[1]);
  return [visible, setVisible, openFn, closeFn];
};
// tslint:enable: no-empty

export default useModal;
