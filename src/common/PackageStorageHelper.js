console.log("aaaaaaaaaa");
var AdmZip = require('adm-zip');
console.log("aaaaaaaaaa");
var fs = require('fs');
var async = require('async');
var glob = require("glob");
var path = require('path');

/**
 * Allow the storage module to load files bundled in the Electron application.
 */
class PackageStorageHelper {
  constructor(storageInstance, packageDir) {
    console.log(packageDir);
    this.parent = storageInstance;
    this.packgeDir = packageDir;
    this.fileMap = {};
    this.loadedZipFiles = {};
  }

  /**
   * Fetch an asset but don't process dependencies.
   * @param {AssetType} assetType - The type of asset to fetch.
   * @param {string} assetId - The ID of the asset to fetch: a project ID, MD5, etc.
   * @param {DataFormat} dataFormat - The file format / file extension of the asset to fetch: PNG, JPG, etc.
   * @return {Promise.<Asset>} A promise for the contents of the asset.
   */
  load(assetType, assetId, dataFormat) {
    assetId = path.basename(assetId);
    dataFormat = path.basename(dataFormat);

    return new Promise((resolve, reject) => {
      var pattern = path.join(this.packgeDir, "*.zip");
      glob.glob(pattern, (err, files) => {
        if (err != null) {
          console.error("find package files fail, error:" + err);
          done();
          return;
        }
        console.log(files);
        async.forEach(files, (file, done) => {
          if (file in this.loadedZipFiles) {
            done();
            return;
          }

          var zip = new AdmZip(file);
          var zipEntries = zip.getEntries();
          zipEntries.forEach((zipEntry) => {
            if (zipEntry.isDirectory) {
              return;
            }
            this.fileMap[zipEntry.entryName] = zip;
          });
          this.loadedZipFiles[file] = true;
          done();
        }, (err) => {
          let fileName = `${assetId}.${dataFormat}`;
          let filePath = path.join('images', fileName);
          if (filePath in this.fileMap) {
            let zip = this.fileMap[filePath];
            zip.readFileAsync(filePath, (data, err) => {
              if (data != null) {
                resolve(new this.parent.Asset(assetType, assetId, dataFormat, data));
              } else {
                reject(err);
              }
            });
          } else {
            reject('not found');
          }
        })
      });
    });
  }
}

module.exports = PackageStorageHelper;

