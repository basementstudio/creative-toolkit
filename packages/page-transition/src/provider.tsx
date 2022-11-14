import * as React from "react";

import { clearSavedPageStyles, savePageStyles } from "./save-page-styles";
import { useIsoLayoutEffect } from "./hooks/use-iso-layout-effect";

type TransitionCallback = (newPathname: string) => Promise<void>;
type TransitionOptions = { index?: number; kill?: boolean };
type Status = "idle" | "transitioning";

type GetTransitionSpace = (
  callback: TransitionCallback,
  options?: TransitionOptions
) => void;
const TransitionContext = React.createContext<
  | {
      transitionsListRef: React.MutableRefObject<
        Array<{
          callback: TransitionCallback;
          options?: TransitionOptions;
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

const TransitionContextProvider = ({
  children,
}: {
  children?: React.ReactNode;
}) => {
  const transitionsListRef = React.useRef<
    Array<{ callback: TransitionCallback; options?: TransitionOptions }>
  >([]);
  const [status, setStatus] = React.useState<Status>("idle");

  const getTransitionSpace: GetTransitionSpace = React.useCallback(
    (callback: TransitionCallback, options) => {
      if (options?.index) {
        transitionsListRef.current.splice(options.index, 0, {
          callback,
          options,
        });
      } else {
        transitionsListRef.current.push({ callback, options });
      }
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
      "usePageTransition must be used within a PageTransitionsProvider"
    );
  }
  return ctx;
};

const useSetStatus = () => {
  const ctx = React.useContext(SetStatusContext);
  if (ctx === undefined) {
    throw new Error(
      "useSetStatus must be used within a PageTransitionsProvider"
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

const PageTransitionsProvider = ({
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

export { PageTransitionsProvider, usePageTransition };
