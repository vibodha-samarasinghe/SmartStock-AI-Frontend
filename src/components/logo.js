import Image from "next/image";

export default function Logo({ className = "h-16 w-16" }) {
  return (
    <Image
      src="/Images/logo1.jpg"
      alt="SmartStock AI Logo"
      width={150}
      height={150}
      priority
      className={`h-full w-full object-contain ${className}`}
    />
  );
}
