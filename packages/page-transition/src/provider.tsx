import * as React from "react";

import { clearSavedPageStyles, savePageStyles } from "./save-page-styles";
import { useIsoLayoutEffect } from "./hooks/use-iso-layout-effect";

type TransitionCallback = (newPathname: string) => void | Promise<void>;
type TransitionOptions = { kill?: boolean };
type Status = "idle" | "transitioning";

type GetTransitionSpace = (
  callback: TransitionCallback,
  options?: TransitionOptions
) => () => void;
const TransitionContext = React.createContext<
  | {
      transitionsListRef: React.MutableRefObject<
        Array<{
          callback: TransitionCallback;
          options?: TransitionOptions;
          id: number;
        }>
      >;
      getTransitionSpace: GetTransitionSpace;
      status: Status;
    }
  | undefined
>(undefined);

const SetStatusContext = React.createContext<
  { setStatus: React.Dispatch<React.SetStateAction<Status>> } | undefined
>(undefined);

let id = 0;

const TransitionContextProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const transitionsListRef = React.useRef<
    Array<{
      callback: TransitionCallback;
      options?: TransitionOptions;
      id: number;
    }>
  >([]);
  const [status, setStatus] = React.useState<Status>("idle");

  const getTransitionSpace: GetTransitionSpace = React.useCallback(
    (callback: TransitionCallback, options) => {
      const transitionId = id++;

      transitionsListRef.current.push({
        callback,
        options,
        id: transitionId,
      });

      return () => {
        transitionsListRef.current = transitionsListRef.current.filter(
          (t) => t.id !== transitionId
        );
      };
    },
    []
  );

  return (
    <SetStatusContext.Provider value={{ setStatus }}>
      <TransitionContext.Provider
        value={{ transitionsListRef, getTransitionSpace, status }}
      >
        {children}
      </TransitionContext.Provider>
    </SetStatusContext.Provider>
  );
};

const usePageTransition = () => {
  const ctx = React.useContext(TransitionContext);
  if (ctx === undefined) {
    throw new Error(
      "usePageTransition must be used within a PageTransitionProvider"
    );
  }
  return ctx;
};

const useSetStatus = () => {
  const ctx = React.useContext(SetStatusContext);
  if (ctx === undefined) {
    throw new Error(
      "useSetStatus must be used within a PageTransitionProvider"
    );
  }
  return ctx;
};

// This is another component so that it doesn't trigger a re-render in the context provider
const TransitionLayout = React.memo(
  ({ children }: { children?: React.ReactNode }) => {
    const [displayChildren, setDisplayChildren] = React.useState(children);
    const { transitionsListRef } = usePageTransition();
    const { setStatus } = useSetStatus();
    const oldPathnameRef = React.useRef<string>("");

    React.useEffect(() => {
      // init pathname
      oldPathnameRef.current = window.location.pathname;
    }, []);

    useIsoLayoutEffect(() => {
      const newPathname = window.location.pathname;
      if (
        children !== displayChildren &&
        oldPathnameRef.current !== newPathname
      ) {
        savePageStyles();
        if (transitionsListRef.current.length === 0) {
          // there are no outro animations, so immediately transition
          setDisplayChildren(children);
          oldPathnameRef.current = newPathname;
          clearSavedPageStyles();

          setStatus("idle");
        } else {
          setStatus("transitioning");
          const transitionsPromise = transitionsListRef.current.map(
            async (transition) => {
              await transition.callback(newPathname);
              return transition;
            }
          );
          Promise.all(transitionsPromise)
            .then((resolvedTransitions) => {
              setDisplayChildren(children);
              oldPathnameRef.current = newPathname;
              transitionsListRef.current = resolvedTransitions.filter((t) =>
                t.options?.kill ? false : true
              );
              clearSavedPageStyles();
            })
            .then(() => {
              setStatus("idle");
            });
        }
      }
    }, [children, displayChildren, transitionsListRef]);

    return <>{displayChildren}</>;
  }
);

const PageTransitionProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  return (
    <TransitionContextProvider>
      <TransitionLayout>{children}</TransitionLayout>
    </TransitionContextProvider>
  );
};

export { PageTransitionProvider, usePageTransition };
