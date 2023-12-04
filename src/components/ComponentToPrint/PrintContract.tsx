import * as React from "react";
import { useReactToPrint } from "react-to-print";
import ComponentToPrint from ".";
import Loader from "../Loader";
import { AiTwotonePrinter } from "react-icons/ai";
import ColorButton from "../ColorButton";
import { cn } from "../../lib/cs";

export const PrintContract = ({ getValues }: any) => {
  const componentRef = React.useRef(null);

  const onBeforeGetContentResolve = React.useRef<any>(null);

  const [loading, setLoading] = React.useState(false);
  const [text, setText] = React.useState("old boring text");

  const handleAfterPrint = React.useCallback(() => {
    console.log("`onAfterPrint` called"); // tslint:disable-line no-console
  }, []);

  const handleBeforePrint = React.useCallback(() => {
    console.log("`onBeforePrint` called"); // tslint:disable-line no-console
  }, []);

  const handleOnBeforeGetContent = React.useCallback(() => {
    console.log("`onBeforeGetContent` called"); // tslint:disable-line no-console
    setLoading(true);
    setText("Loading new text...");

    return new Promise((resolve: any) => {
      onBeforeGetContentResolve.current = resolve;

      setTimeout(() => {
        setLoading(false);
        setText("New, Updated Text!");
        resolve();
      }, 2000);
    });
  }, [setLoading, setText]);

  const reactToPrintContent = React.useCallback(() => {
    return componentRef.current;
  }, [componentRef.current]);

  const handlePrint = useReactToPrint({
    content: reactToPrintContent,
    documentTitle: "PrintContract",
    onBeforeGetContent: handleOnBeforeGetContent,
    onBeforePrint: handleBeforePrint,
    onAfterPrint: handleAfterPrint,
    removeAfterPrint: true,
  });

  React.useEffect(() => {
    if (
      text === "New, Updated Text!" &&
      typeof onBeforeGetContentResolve.current === "function"
    ) {
      onBeforeGetContentResolve.current();
    }
  }, [onBeforeGetContentResolve.current, text]);

  return (
    <>
      <ColorButton
        override="blue"
        size="small"
        htmlType="submit"
        type="primary"
        loading={loading}
        icon={<AiTwotonePrinter />}
        onClick={handlePrint}
      ></ColorButton>
      <div className="flex justify-center items-center">
        {loading && <Loader />}
        <div className={cn(loading && "hidden absolute w-full h-full z-10")}>
          <ComponentToPrint
            ref={componentRef}
            loading={loading}
            getValues={getValues}
          />
        </div>
      </div>
    </>
  );
};
