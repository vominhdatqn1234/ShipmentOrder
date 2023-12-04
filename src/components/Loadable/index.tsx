import React, { Suspense } from "react";
import Loader from "../Loader";

// ===========================|| LOADABLE - LAZY LOADING ||=========================== //

// Define the type for props that your wrapped component accepts
type ComponentProps = {};

type LazyComponentType = React.ComponentType<ComponentProps>;

const Loadable = (Component: LazyComponentType) => (props: ComponentProps) =>
  (
    <Suspense fallback={<Loader />}>
      <Component {...props} />
    </Suspense>
  );

export default Loadable;
