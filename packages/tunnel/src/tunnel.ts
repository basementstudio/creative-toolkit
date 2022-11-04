import React, { memo, useId, useEffect, useLayoutEffect } from "react";
import create, { StoreApi, UseBoundStore } from "zustand";

import { flattenObject, pascal } from "./utils";

const useIsoLayoutEffect =
  typeof document === "undefined" ? useEffect : useLayoutEffect;

type Props = { children?: React.ReactNode | null };
type State = {
  current: Record<string, Record<string, React.ReactNode>>;
  pushChildren: (children: State["current"][string], branch: string) => void;
  clearChild: (branch: string, childId: string) => void;
};

type TunnelParams = {
  branches: string[];
};

const createBranchComponents = (
  useStore: UseBoundStore<StoreApi<State>>,
  branch: string
) => {
  const isDefault = branch === "default";

  return {
    [isDefault ? "In" : `In${pascal(branch)}`]: memo(({ children }: Props) => {
      const pushChildren = useStore((state) => state.pushChildren);
      const clearChild = useStore((state) => state.clearChild);
      const id = useId();

      useIsoLayoutEffect(() => {
        if (children === null || children === undefined) return;

        pushChildren({ [id]: children }, branch);

        return () => {
          clearChild(branch, id);
        };
      }, [children, pushChildren, id, clearChild]);

      return null;
    }),
    [isDefault ? "Out" : `Out${pascal(branch)}`]: () => {
      const current = useStore((state) => state.current[branch] || {});
      return Object.values(current);
    },
  };
};

export const tunnel = (branches?: TunnelParams["branches"]) => {
  const useStore = create<State>((set) => ({
    current: {},
    pushChildren: (children, branch) => {
      set((state) => {
        const result = {
          ...state.current,
          [branch]: {
            ...state.current[branch],
            ...children,
          },
        };

        return { current: result };
      });
    },
    clearChild: (branch: string, childId: string) => {
      set((state) => {
        const result = {
          ...state.current,
          [branch]: {
            ...state.current[branch],
            [childId]: null,
          },
        };

        return { current: result };
      });
    },
  }));

  const hasBranches = branches && branches.length > 0;

  return hasBranches
    ? flattenObject(
        ["default", ...(branches || [])].map((b) =>
          createBranchComponents(useStore, b)
        )
      )
    : createBranchComponents(useStore, "default");
};
