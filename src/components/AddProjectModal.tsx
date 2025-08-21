import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { X, Loader2, UploadCloud, FileImage, Plus, Trash2 } from 'lucide-react';

interface TeamMember {
  name: string;
  role: string;
  linkedin_url?: string;
  twitter_url?: string;
}

const AddProjectModal = () => {
  const { user, closeAddProjectModal } = useAuth();
  const [name, setName] = useState('');
  const [tagline, setTagline] = useState('');
  const [description, setDescription] = useState('');
  const [longDescription, setLongDescription] = useState('');
  const [tags, setTags] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [pricingType, setPricingType] = useState('Free');
  const [pricingDetails, setPricingDetails] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [launchDate, setLaunchDate] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [galleryFiles, setGalleryFiles] = useState<File[]>([]);
  const [galleryPreviews, setGalleryPreviews] = useState<string[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([{ name: '', role: '' }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      setGalleryFiles(prev => [...prev, ...files]);
      
      files.forEach(file => {
        const reader = new FileReader();
        reader.onloadend = () => {
          setGalleryPreviews(prev => [...prev, reader.result as string]);
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    setGalleryFiles(prev => prev.filter((_, i) => i !== index));
    setGalleryPreviews(prev => prev.filter((_, i) => i !== index));
  };

  const addTeamMember = () => {
    setTeamMembers(prev => [...prev, { name: '', role: '' }]);
  };

  const removeTeamMember = (index: number) => {
    if (teamMembers.length > 1) {
      setTeamMembers(prev => prev.filter((_, i) => i !== index));
    }
  };

  const updateTeamMember = (index: number, field: keyof TeamMember, value: string) => {
    setTeamMembers(prev => prev.map((member, i) => 
      i === index ? { ...member, [field]: value } : member
    ));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !imageFile) {
      setError('Please fill all required fields and select a main image.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // 1. Upload main image to Supabase Storage
      const fileExt = imageFile.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `product-images/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, imageFile);

      if (uploadError) throw uploadError;

      // 2. Get public URL of the uploaded main image
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      if (!publicUrl) throw new Error("Could not get public URL for the main image.");

      // 3. Upload gallery images
      const galleryUrls: string[] = [];
      for (let i = 0; i < galleryFiles.length; i++) {
        const file = galleryFiles[i];
        const galleryFileExt = file.name.split('.').pop();
        const galleryFileName = `${user.id}-gallery-${Date.now()}-${i}.${galleryFileExt}`;
        const galleryFilePath = `product-images/${galleryFileName}`;

        const { error: galleryUploadError } = await supabase.storage
          .from('product-images')
          .upload(galleryFilePath, file);

        if (galleryUploadError) throw galleryUploadError;

        const { data: { publicUrl: galleryUrl } } = supabase.storage
          .from('product-images')
          .getPublicUrl(galleryFilePath);

        if (galleryUrl) {
          galleryUrls.push(galleryUrl);
        }
      }

      // 4. Insert project data into the 'products' table
      const tagsArray = tags.split(',').map(tag => tag.trim()).filter(Boolean);
      const validTeamMembers = teamMembers.filter(member => member.name.trim() && member.role.trim());

      const { error: insertError } = await supabase.from('products').insert({
        name,
        tagline: tagline.trim() || null,
        description,
        long_description: longDescription.trim() || null,
        tags: tagsArray,
        image_url: publicUrl,
        featured_image_url: publicUrl,
        gallery_images: galleryUrls,
        website_url: websiteUrl.trim() || null,
        pricing_type: pricingType,
        pricing_details: pricingDetails.trim() || null,
        company_name: companyName.trim() || null,
        github_url: githubUrl.trim() || null,
        twitter_url: twitterUrl.trim() || null,
        linkedin_url: linkedinUrl.trim() || null,
        youtube_url: youtubeUrl.trim() || null,
        launch_date: launchDate || new Date().toISOString().split('T')[0],
        team_members: validTeamMembers.length > 0 ? validTeamMembers : null,
        user_id: user.id,
      });

      if (insertError) throw insertError;
      
      // Success
      setLoading(false);
      closeAddProjectModal();
      // Optionally, you could trigger a refetch of products here
      window.location.reload(); // Simple way to refresh data

    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center backdrop-blur-sm">
      <div className="bg-brand-gray-darker border border-brand-gray-dark rounded-xl p-8 w-full max-w-4xl m-4 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={closeAddProjectModal}
          className="absolute top-4 right-4 text-brand-gray hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Add a New Project</h2>
          <p className="text-brand-gray">Showcase your creation to the community with detailed information.</p>
        </div>

        {error && <p className="bg-red-500/20 text-red-400 text-sm p-3 rounded-md mb-4 text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-brand-gray-light mb-2">Project Name *</label>
              <input 
                id="name" 
                type="text" 
                placeholder="e.g., MindMap Pro" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
                required 
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
              />
            </div>

            <div>
              <label htmlFor="tagline" className="block text-sm font-medium text-brand-gray-light mb-2">Tagline</label>
              <input 
                id="tagline" 
                type="text" 
                placeholder="e.g., The ultimate mind mapping tool" 
                value={tagline} 
                onChange={(e) => setTagline(e.target.value)} 
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
              />
            </div>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-brand-gray-light mb-2">Short Description *</label>
            <textarea 
              id="description" 
              placeholder="A short, catchy description of your project." 
              value={description} 
              onChange={(e) => setDescription(e.target.value)} 
              required 
              rows={3} 
              className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
            />
          </div>

          <div>
            <label htmlFor="longDescription" className="block text-sm font-medium text-brand-gray-light mb-2">Detailed Description</label>
            <textarea 
              id="longDescription" 
              placeholder="Tell the full story about your project, its features, and what makes it special." 
              value={longDescription} 
              onChange={(e) => setLongDescription(e.target.value)} 
              rows={6} 
              className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
            />
          </div>

          {/* Company & Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="companyName" className="block text-sm font-medium text-brand-gray-light mb-2">Company Name</label>
              <input 
                id="companyName" 
                type="text" 
                placeholder="e.g., MindMap Inc." 
                value={companyName} 
                onChange={(e) => setCompanyName(e.target.value)} 
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
              />
            </div>

            <div>
              <label htmlFor="websiteUrl" className="block text-sm font-medium text-brand-gray-light mb-2">Website URL</label>
              <input 
                id="websiteUrl" 
                type="url" 
                placeholder="https://yourproject.com" 
                value={websiteUrl} 
                onChange={(e) => setWebsiteUrl(e.target.value)} 
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="githubUrl" className="block text-sm font-medium text-brand-gray-light mb-2">GitHub URL</label>
              <input 
                id="githubUrl" 
                type="url" 
                placeholder="https://github.com/username/repo" 
                value={githubUrl} 
                onChange={(e) => setGithubUrl(e.target.value)} 
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
              />
            </div>

            <div>
              <label htmlFor="twitterUrl" className="block text-sm font-medium text-brand-gray-light mb-2">Twitter URL</label>
              <input 
                id="twitterUrl" 
                type="url" 
                placeholder="https://twitter.com/username" 
                value={twitterUrl} 
                onChange={(e) => setTwitterUrl(e.target.value)} 
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="linkedinUrl" className="block text-sm font-medium text-brand-gray-light mb-2">LinkedIn URL</label>
              <input 
                id="linkedinUrl" 
                type="url" 
                placeholder="https://linkedin.com/company/name" 
                value={linkedinUrl} 
                onChange={(e) => setLinkedinUrl(e.target.value)} 
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
              />
            </div>

            <div>
              <label htmlFor="youtubeUrl" className="block text-sm font-medium text-brand-gray-light mb-2">YouTube Video URL</label>
              <input 
                id="youtubeUrl" 
                type="url" 
                placeholder="https://youtube.com/watch?v=..." 
                value={youtubeUrl} 
                onChange={(e) => setYoutubeUrl(e.target.value)} 
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
              />
            </div>
          </div>

          {/* Pricing & Launch */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label htmlFor="pricingType" className="block text-sm font-medium text-brand-gray-light mb-2">Pricing Type</label>
              <select 
                id="pricingType" 
                value={pricingType} 
                onChange={(e) => setPricingType(e.target.value)} 
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-green transition-colors"
              >
                <option value="Free">Free</option>
                <option value="Freemium">Freemium</option>
                <option value="Paid">Paid</option>
                <option value="Subscription">Subscription</option>
                <option value="One-time">One-time</option>
              </select>
            </div>

            <div>
              <label htmlFor="pricingDetails" className="block text-sm font-medium text-brand-gray-light mb-2">Pricing Details</label>
              <input 
                id="pricingDetails" 
                type="text" 
                placeholder="e.g., $9.99/month" 
                value={pricingDetails} 
                onChange={(e) => setPricingDetails(e.target.value)} 
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
              />
            </div>

            <div>
              <label htmlFor="launchDate" className="block text-sm font-medium text-brand-gray-light mb-2">Launch Date</label>
              <input 
                id="launchDate" 
                type="date" 
                value={launchDate} 
                onChange={(e) => setLaunchDate(e.target.value)} 
                className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-green transition-colors" 
              />
            </div>
          </div>

          <div>
            <label htmlFor="tags" className="block text-sm font-medium text-brand-gray-light mb-2">Tags (comma-separated) *</label>
            <input 
              id="tags" 
              type="text" 
              placeholder="e.g., Productivity, AI, SaaS" 
              value={tags} 
              onChange={(e) => setTags(e.target.value)} 
              required 
              className="w-full bg-brand-gray-dark border border-brand-gray-medium rounded-lg px-4 py-3 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors" 
            />
          </div>
          
          {/* Main Image */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-light mb-2">Main Project Image *</label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-brand-gray-medium px-6 py-10">
              <div className="text-center">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="mx-auto h-32 w-auto rounded-md object-contain" />
                ) : (
                  <UploadCloud className="mx-auto h-12 w-12 text-brand-gray" aria-hidden="true" />
                )}
                <div className="mt-4 flex text-sm leading-6 text-brand-gray-light">
                  <label htmlFor="file-upload" className="relative cursor-pointer rounded-md font-semibold text-brand-green focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-green focus-within:ring-offset-2 focus-within:ring-offset-brand-gray-darker hover:text-brand-green/90">
                    <span>Upload a file</span>
                    <input id="file-upload" name="file-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/gif" onChange={handleImageChange} required />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs leading-5 text-brand-gray">PNG, JPG, GIF up to 10MB</p>
                {imageFile && <p className="text-xs text-brand-green mt-2 flex items-center justify-center gap-2"><FileImage className="w-4 h-4" /> {imageFile.name}</p>}
              </div>
            </div>
          </div>

          {/* Gallery Images */}
          <div>
            <label className="block text-sm font-medium text-brand-gray-light mb-2">Gallery Images (Optional)</label>
            <div className="mt-2 flex justify-center rounded-lg border border-dashed border-brand-gray-medium px-6 py-10">
              <div className="text-center">
                {galleryPreviews.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    {galleryPreviews.map((preview, index) => (
                      <div key={index} className="relative">
                        <img src={preview} alt={`Gallery ${index + 1}`} className="h-20 w-full object-cover rounded-md" />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(index)}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-4 flex text-sm leading-6 text-brand-gray-light">
                  <label htmlFor="gallery-upload" className="relative cursor-pointer rounded-md font-semibold text-brand-green focus-within:outline-none focus-within:ring-2 focus-within:ring-brand-green focus-within:ring-offset-2 focus-within:ring-offset-brand-gray-darker hover:text-brand-green/90">
                    <span>Add gallery images</span>
                    <input id="gallery-upload" name="gallery-upload" type="file" className="sr-only" accept="image/png, image/jpeg, image/gif" multiple onChange={handleGalleryChange} />
                  </label>
                </div>
                <p className="text-xs leading-5 text-brand-gray">Add multiple images to showcase your project</p>
              </div>
            </div>
          </div>

          {/* Team Members */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-brand-gray-light">Team Members</label>
              <button
                type="button"
                onClick={addTeamMember}
                className="flex items-center gap-2 text-brand-green hover:text-brand-green/80 transition-colors text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Member
              </button>
            </div>
            <div className="space-y-4">
              {teamMembers.map((member, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-brand-gray-dark rounded-lg">
                  <input
                    type="text"
                    placeholder="Name"
                    value={member.name}
                    onChange={(e) => updateTeamMember(index, 'name', e.target.value)}
                    className="bg-brand-gray-darker border border-brand-gray-medium rounded-lg px-3 py-2 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors"
                  />
                  <input
                    type="text"
                    placeholder="Role"
                    value={member.role}
                    onChange={(e) => updateTeamMember(index, 'role', e.target.value)}
                    className="bg-brand-gray-darker border border-brand-gray-medium rounded-lg px-3 py-2 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      type="url"
                      placeholder="LinkedIn URL (optional)"
                      value={member.linkedin_url || ''}
                      onChange={(e) => updateTeamMember(index, 'linkedin_url', e.target.value)}
                      className="flex-1 bg-brand-gray-darker border border-brand-gray-medium rounded-lg px-3 py-2 text-white placeholder-brand-gray focus:outline-none focus:border-brand-green transition-colors"
                    />
                    {teamMembers.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTeamMember(index)}
                        className="text-red-400 hover:text-red-300 transition-colors p-2"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button type="submit" disabled={loading} className="w-full mt-6 bg-brand-green text-black font-bold py-3 rounded-lg hover:bg-brand-green/90 transition-colors flex items-center justify-center disabled:opacity-50">
            {loading && <Loader2 className="w-5 h-5 mr-2 animate-spin" />}
            {loading ? 'Submitting...' : 'Submit Project'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddProjectModal;
