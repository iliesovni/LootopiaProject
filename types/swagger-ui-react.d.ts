declare module "swagger-ui-react" {
    import * as React from "react";

    interface SwaggerUIProps {
        spec: object;
    }

    const SwaggerUI: React.FC<SwaggerUIProps>;

    export default SwaggerUI;
}