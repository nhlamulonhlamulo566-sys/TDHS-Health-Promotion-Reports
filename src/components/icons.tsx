import type { SVGProps } from "react";
import Image from "next/image";

export const Icons = {
  logo: (props: any) => (
      (() => {
        const { PROVINCIAL_LOGO_PATH } = require("@/lib/logo");
        const logoSrc = PROVINCIAL_LOGO_PATH || "/icons/SA-Department-of-Health-Logo.jpg";
        return (
          <Image 
            src={logoSrc} 
            alt="Provincial Health Logo"
            width={40}
            height={40}
            priority
            className={props.className}
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        );
      })()
  ),
};
