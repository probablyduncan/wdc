type SlideModuleExport = {
    transitions?: string[];
    nextPage?: string;
    url: string;
    file: string;
}

type PageInfo = {
    this: string;
    next?: string;
    prev?: string;
    transitions: string[];
    startIndex: number;
    totalCount: number;
}