import React from "react";
import { motion } from "framer-motion";
import {
  FaClock,
  FaLayerGroup,
  FaServer,
  FaShieldAlt,
  FaRocket,
  FaFileCode,
  FaTag,
  FaCheckCircle,
  FaCog
} from "react-icons/fa";

const ConfigMetadata = ({ metadata, configType }) => {
  if (!metadata) return null;

  const getIconForFeature = (feature) => {
    const featureIcons = {
      security: FaShieldAlt,
      optimization: FaRocket,
      caching: FaLayerGroup,
      'health check': FaCheckCircle,
      'hot reload': FaCog,
      'multi-stage': FaLayerGroup,
      'non-root': FaShieldAlt,
      logging: FaFileCode,
      database: FaServer,
    };
    
    const lowerFeature = feature.toLowerCase();
    for (const [key, icon] of Object.entries(featureIcons)) {
      if (lowerFeature.includes(key)) {
        return icon;
      }
    }
    return FaTag;
  };

  const MetadataItem = ({ label, value, icon: Icon = FaTag }) => {
    if (!value) return null;
    
    return (
      <div className="flex items-center space-x-3 p-3 bg-gray-800/30 rounded-lg">
        <Icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-gray-300">{label}</div>
          <div className="text-sm text-gray-400 break-words">
            {Array.isArray(value) ? value.join(", ") : value}
          </div>
        </div>
      </div>
    );
  };

  const FeatureList = ({ features, title }) => {
    if (!features || features.length === 0) return null;
    
    return (
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-300">{title}</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {features.map((feature, index) => {
            const Icon = getIconForFeature(feature);
            return (
              <div key={index} className="flex items-center space-x-2 p-2 bg-gray-800/20 rounded">
                <Icon className="w-3 h-3 text-green-400" />
                <span className="text-xs text-gray-300">{feature}</span>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-gray-900/50 border border-gray-700/50 rounded-xl p-6 space-y-4"
    >
      <div className="flex items-center space-x-2 mb-4">
        <FaCog className="w-5 h-5 text-blue-400" />
        <h3 className="text-lg font-semibold text-white">
          {configType} Configuration Details
        </h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Basic Info */}
        <MetadataItem 
          label="Build Time Estimate" 
          value={metadata.build_time_estimate} 
          icon={FaClock} 
        />
        <MetadataItem 
          label="Size Estimate" 
          value={metadata.size_estimate} 
          icon={FaLayerGroup} 
        />
        
        {/* Ports */}
        {metadata.ports_exposed && (
          <MetadataItem 
            label="Exposed Ports" 
            value={metadata.ports_exposed} 
            icon={FaServer} 
          />
        )}
        
        {/* Base Image */}
        <MetadataItem 
          label="Base Image" 
          value={metadata.base_image} 
          icon={FaLayerGroup} 
        />
        
        {/* Environment Variables */}
        {metadata.environment_variables && Object.keys(metadata.environment_variables).length > 0 && (
          <div className="md:col-span-2">
            <MetadataItem 
              label="Environment Variables" 
              value={Object.entries(metadata.environment_variables).map(([k, v]) => `${k}=${v}`)} 
              icon={FaCog} 
            />
          </div>
        )}
      </div>

      {/* Features */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
        <FeatureList 
          features={metadata.security_features} 
          title="Security Features" 
        />
        <FeatureList 
          features={metadata.optimization_features} 
          title="Optimization Features" 
        />
        {metadata.features && (
          <FeatureList 
            features={metadata.features} 
            title="Additional Features" 
          />
        )}
      </div>

      {/* Services (for docker-compose) */}
      {metadata.services && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-300 mb-3">Services</h4>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {Object.entries(metadata.services).map(([name, service]) => (
              <div key={name} className="bg-gray-800/30 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <FaServer className="w-4 h-4 text-blue-400" />
                  <span className="font-medium text-gray-200">{name}</span>
                </div>
                <p className="text-xs text-gray-400 mb-2">{service.description}</p>
                {service.ports && (
                  <div className="text-xs text-gray-500">
                    Ports: {service.ports.join(", ")}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Build Instructions */}
      {metadata.build_instructions && (
        <div className="mt-6 p-4 bg-gray-800/30 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
            <FaRocket className="w-4 h-4 mr-2 text-green-400" />
            Quick Start Commands
          </h4>
          <div className="space-y-1">
            {metadata.build_instructions.map((instruction, index) => (
              <code key={index} className="block text-xs text-green-300 font-mono bg-gray-900/50 p-2 rounded">
                {instruction}
              </code>
            ))}
          </div>
        </div>
      )}

      {/* Usage Instructions */}
      {metadata.usage_instructions && (
        <div className="mt-4 p-4 bg-gray-800/30 rounded-lg">
          <h4 className="text-sm font-medium text-gray-300 mb-2 flex items-center">
            <FaFileCode className="w-4 h-4 mr-2 text-purple-400" />
            Usage Instructions
          </h4>
          <div className="space-y-1">
            {metadata.usage_instructions.map((instruction, index) => (
              <code key={index} className="block text-xs text-purple-300 font-mono bg-gray-900/50 p-2 rounded">
                {instruction}
              </code>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default ConfigMetadata;
