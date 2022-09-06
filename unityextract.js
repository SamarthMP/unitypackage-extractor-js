var assetBuffer = null;
var zip = null;
var useMeta = false;

function status(stat){

    console.log(stat)
    //Make sure to catch this
    try{
        document.getElementById("statusText").innerText = stat;
    }
    catch {}
}

function extractAsset(asset){

    var pathName = readAllText(getFileInside(asset, "pathname")).split("\n")[0];
    console.log(pathName)
    var assetFile = getFileInside(asset, "asset");

    status("Extracting " + pathName.split("/")[pathName.split("/").length - 1]);

    if (assetFile == null){
        //The asset is a folder not a file
        zip.folder(pathName);
    }
    else{
        zip.file(pathName, assetFile.buffer);
    }

    //Extract Meta
    if (useMeta){
        var metaFile = getFileInside(asset, "asset.meta");
        console.log(pathName + ".meta");
        zip.file(pathName + ".meta", metaFile.buffer);
    }
}

function extract(bytes, _useMeta, name)
{
    status("Extracting GZIP")
    try {
        var result = pako.inflate(bytes);
        status("Extracting Tar")
        untar(result.buffer)
            .progress(function(extractedFile) {
                status("Extracting " + extractedFile.name);
            })
            .then(function(extractedFiles) {
                assetBuffer = extractedFiles;
                zip = new JSZip();
                useMeta = _useMeta;
                var folders = getAssetFolders();
                
                //Each folder is a different asset
                folders.forEach(asset => {
                    extractAsset(asset);
                });

                status("Generating Zip");
                zip.generateAsync({type:"blob"}).then(function(content) {
                    status("Extraction Complete");
                    saveAs(content, name + ".zip");
                });
            });

    } catch (err) {
        error(err)
    }
}

function error(message) {
    status("[ERROR] " + message);
}

//Reads the text content of a virtual file
function readAllText(file){
    return (new TextDecoder("utf-8")).decode(file.buffer);
}

function getAssetFolders(){
    var folders = [];
    assetBuffer.forEach((f) => {
        //If it's a meta file
        //For some reason folders don't always show up
        //So we have to find a meta file
        if (f.name.endsWith(".meta")){
            var fname = f.name.split("/")[0];
            folders.push({
                name: fname
            });
        }
    });
    return folders;
}

function getFilesInside(folder){
    var files = [];
    assetBuffer.forEach((f) => {
        //If it's not a folder and it also starts with the folder name
        if (!f.name.endsWith("/") && f.name.startsWith(folder.name)){
            files.push(f);
        }
    })
    return files;
}

function getFileInside(folder, file) {
    var files = getFilesInside(folder);
    return files.find(element => element.name.endsWith(file)) || null;
}