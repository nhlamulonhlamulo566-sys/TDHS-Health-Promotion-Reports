import type { SVGProps } from "react";
import Image from "next/image";

export const Icons = {
  logo: (props: any) => (
    <Image 
      src="/icons/SA-Department-of-Health-Logo.jpg" 
      alt="Department of Health Logo"
      width={40}
      height={40}
      priority
      className={props.className}
      style={{ maxWidth: '100%', height: 'auto' }}
    />
  ),
};
