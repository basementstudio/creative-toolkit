import * as React from "react";
import type { NextRouter } from "next/router";

import { savePageStyles } from "./save-page-styles";
import { useIsoLayoutEffect } from "./hooks/use-iso-layout-effect";

type TransitionCallback = (newPathname: string) => Promise<void | (() => void)>;
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
          cleanup: (() => void) | null;
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
      cleanup: (() => void) | null;
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
        cleanup: null,
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
  ({
    children,
    nextRouter,
    unsafeCssPreservation,
  }: {
    children?: React.ReactNode;
    nextRouter: NextRouter | null;
    unsafeCssPreservation: boolean | undefined;
  }) => {
    const [displayChildren, setDisplayChildren] = React.useState(children);
    const { transitionsListRef, status } = usePageTransition();
    const { setStatus } = useSetStatus();
    const oldPathnameRef = React.useRef<string>("");

    React.useEffect(() => {
      // init pathname
      oldPathnameRef.current = window.location.pathname;
    }, []);

    // if unsafeCssPreservation is present, we make the next.js hack to save the page's styles
    // see https://github.com/vercel/next.js/issues/17464
    React.useEffect(() => {
      if (status === "idle" && unsafeCssPreservation) {
        savePageStyles();
      }
    }, [unsafeCssPreservation, status]);

    React.useEffect(() => {
      if (!nextRouter) return;

      function handleRouteChangeStart(newUrl: string) {
        if (
          hasChangedRoute({
            children,
            displayChildren,
            newPathname: newUrl,
            oldPathname: oldPathnameRef.current,
          }) &&
          hasPendingTransitions({ transitionsList: transitionsListRef.current })
        ) {
          setStatus("transitioning");
        }
      }

      nextRouter.events.on("routeChangeStart", handleRouteChangeStart);

      return () => {
        nextRouter.events.off("routeChangeStart", handleRouteChangeStart);
      };
    }, [children, displayChildren, nextRouter, setStatus, transitionsListRef]);

    useIsoLayoutEffect(() => {
      const newPathname = window.location.pathname;

      if (
        hasChangedRoute({
          children,
          displayChildren,
          newPathname,
          oldPathname: oldPathnameRef.current,
        })
      ) {
        if (
          !hasPendingTransitions({
            transitionsList: transitionsListRef.current,
          })
        ) {
          // there are no outro animations, so immediately transition
          setDisplayChildren(children);
          oldPathnameRef.current = newPathname;

          setStatus("idle");
        } else {
          setStatus("transitioning");
          const transitionsPromise = transitionsListRef.current.map(
            async (transition) => {
              transition.cleanup?.();
              const newCleanup = await transition.callback(newPathname);
              if (newCleanup) transition.cleanup = newCleanup;
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

function hasChangedRoute({
  children,
  displayChildren,
  oldPathname,
  newPathname,
}: {
  children: React.ReactNode;
  displayChildren: React.ReactNode;
  oldPathname: string;
  newPathname: string;
}): boolean {
  return children !== displayChildren && oldPathname !== newPathname;
}

function hasPendingTransitions({
  transitionsList,
}: {
  transitionsList: unknown[];
}): boolean {
  return transitionsList.length > 0;
}

const PageTransitionProvider = ({
  children,
  nextRouter,
  unsafeCssPreservation,
}: {
  children?: React.ReactNode;
  nextRouter: NextRouter | null;
  unsafeCssPreservation?: boolean;
}) => {
  return (
    <TransitionContextProvider>
      <TransitionLayout
        unsafeCssPreservation={unsafeCssPreservation}
        nextRouter={nextRouter}
      >
        {children}
      </TransitionLayout>
    </TransitionContextProvider>
  );
};

export { PageTransitionProvider, usePageTransition };
