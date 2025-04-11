import React, { useEffect, useState } from 'react';
import { CKEditor } from '@ckeditor/ckeditor5-react';
import ClassicEditor from '@ckeditor/ckeditor5-build-classic';
import { storage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface RichTextEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
  height?: string;
  label?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter content here...',
  height = '250px',
  label
}) => {
  const [editorReady, setEditorReady] = useState(false);
  const [editorInstance, setEditorInstance] = useState<any>(null);

  useEffect(() => {
    // Add custom CKEditor CSS if needed
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.ckeditor.com/ckeditor5/40.2.0/classic/ckeditor.css';
    document.head.appendChild(link);

    return () => {
      document.head.removeChild(link);
    };
  }, []);

  const uploadAdapter = (loader: any) => {
    return {
      upload: () => {
        return new Promise((resolve, reject) => {
          loader.file.then((file: File) => {
            // Create a unique filename
            const filename = `uploads/ielts-content/${uuidv4()}-${file.name}`;
            const storageRef = ref(storage, filename);

            // Upload file to Firebase Storage
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
              (snapshot) => {
                // You can track upload progress here if needed
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                console.log('Upload is ' + progress + '% done');
              },
              (error) => {
                console.error('Upload failed:', error);
                reject(error);
              },
              () => {
                // Upload completed successfully, get download URL
                getDownloadURL(uploadTask.snapshot.ref).then((downloadURL) => {
                  resolve({
                    default: downloadURL
                  });
                });
              }
            );
          });
        });
      }
    };
  };

  function uploadPlugin(editor: any) {
    editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
      return uploadAdapter(loader);
    };
  }

  const customConfig = {
    extraPlugins: [uploadPlugin],
    toolbar: {
      items: [
        'heading',
        '|',
        'bold',
        'italic',
        'underline',
        'fontSize',
        'fontColor',
        'link',
        'bulletedList',
        'numberedList',
        '|',
        'outdent',
        'indent',
        'alignment',
        '|',
        'imageUpload',
        'blockQuote',
        'insertTable',
        'mediaEmbed',
        'undo',
        'redo',
      ]
    },
    image: {
      toolbar: [
        'imageStyle:inline',
        'imageStyle:block',
        'imageStyle:side',
        '|',
        'toggleImageCaption',
        'imageTextAlternative'
      ]
    },
    table: {
      contentToolbar: [
        'tableColumn',
        'tableRow',
        'mergeTableCells',
        'tableCellProperties',
        'tableProperties'
      ]
    },
    // This value must be kept in sync with the language defined in webpack.config.js.
    language: 'en'
  };

  return (
    <div className="rich-text-editor-container">
      {label && <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>}
      <div 
        style={{ 
          border: '1px solid #e2e8f0', 
          borderRadius: '0.375rem',
          minHeight: height 
        }}
      >
        <CKEditor
          editor={ClassicEditor}
          config={customConfig}
          data={value}
          onReady={(editor) => {
            // Save the editor instance
            setEditorInstance(editor);
            setEditorReady(true);

            // Set the placeholder text
            if (placeholder) {
              editor.editing.view.change((writer: any) => {
                writer.setAttribute(
                  'data-placeholder',
                  placeholder,
                  editor.editing.view.document.getRoot()
                );
              });
            }

            // You can store the "editor" and use when it is needed.
            console.log('Editor is ready to use!', editor);
          }}
          onChange={(event, editor) => {
            const data = editor.getData();
            onChange(data);
          }}
        />
      </div>
    </div>
  );
};

export default RichTextEditor;