export default function AuthBackdrop() {
  return (
    <>
      <div className="login-page__texture" aria-hidden="true" />
      <div className="login-page__moon" aria-hidden="true"><span /></div>
      <span className="login-page__star login-page__star--one" aria-hidden="true" />
      <span className="login-page__star login-page__star--two" aria-hidden="true" />
      <span className="login-page__star login-page__star--three" aria-hidden="true" />
      <span className="login-page__star login-page__star--four" aria-hidden="true" />
      <svg className="login-landscape" viewBox="0 0 1440 390" preserveAspectRatio="xMidYMax slice" aria-hidden="true">
        <path d="M0 210 118 116l71 55 127-112 119 130 118-89 113 75 132-121 126 115 111-74 142 96 120-99 163 119v179H0Z" fill="#1b3940" fillOpacity=".72" />
        <path d="m0 264 142-83 103 50 108-76 112 88 107-57 108 71 120-91 105 57 103-67 126 73 107-57 99 53v165H0Z" fill="#0d2226" fillOpacity=".92" />
        <path d="M0 312c171-31 267-72 424-51 153 20 233 59 386 29 177-35 290-41 412-12 100 24 154 44 218 38v74H0Z" fill="#08181d" />
        <g fill="none" stroke="#b9b994" strokeOpacity=".15" strokeWidth="1.3">
          <path d="M-60 286c129-64 254-54 361-15 126 46 221 40 332-5 118-48 237-52 350-5 108 45 236 44 516-22" />
          <path d="M-55 306c133-58 249-45 350-9 126 45 227 46 347 1 121-45 237-45 346-1 114 46 245 44 513-18" />
          <path d="M-50 328c133-51 246-39 339-5 127 46 235 50 358 8 119-41 236-39 345 5 122 49 259 47 508-13" />
        </g>
        <g fill="#07171b" fillOpacity=".9">
          <path d="m54 318 22-39 22 39h-11l21 35H44l21-35Zm96-17 17-30 17 30h-9l17 29h-41l17-29Zm110 20 25-44 25 44h-12l23 39h-72l23-39Zm101-38 18-32 18 32h-9l18 31h-54l18-31Zm775 32 22-39 22 39h-11l21 35h-64l21-35Zm102-19 17-30 17 30h-9l17 29h-50l17-29Zm93 27 26-46 26 46h-13l24 40h-74l24-40Zm93-39 17-30 17 30h-9l17 29h-50l17-29Z" />
        </g>
      </svg>
    </>
  );
}