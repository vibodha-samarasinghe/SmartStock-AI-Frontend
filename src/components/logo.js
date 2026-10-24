import Image from "next/image";

export default function Logo() {
  return (
    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-purple-200 bg-white p-2 shadow-md">
      <Image
        src="/images/logo1.jpg"
        alt="SmartStock AI Logo"
        width={150}
        height={150}
        priority
        className="h-full w-full object-contain"
      />
    </div>
  );
}